require 'digest'

class AutoFaqResponder
  UNABLE_MARKER = "UNABLE"

  def self.call(conversation, message)
    new(conversation, message).call
  end

  def initialize(conversation, message, bedrock_client: default_bedrock_client)
    @conversation = conversation
    @message = message
    @bedrock_client = bedrock_client
  end

  def call
    return unless should_trigger?

    faq_data = cached_faq_content
    return if faq_data.blank?

    answer = get_llm_answer(faq_data[:content])
    return if answer.blank? || unable_to_answer?(answer)

    create_faq_message(answer, faq_data[:urls])

  rescue StandardError => e
    Rails.logger.error("AutoFaqResponder failed: #{e.class}: #{e.message}")
    nil
  end

  private

  def should_trigger?
    # Only first message from initiator
    return false unless @conversation.messages.count == 1
    return false unless @message.sender_id == @conversation.initiator_id

    # Only if auto-assigned to expert with knowledge base
    return false unless @conversation.assigned_expert_id.present?

    expert_profile = @conversation.assigned_expert&.expert_profile
    return false unless expert_profile&.knowledge_base_links&.any?

    true
  end

  def fetch_faq_content
    expert_profile = @conversation.assigned_expert.expert_profile
    urls = Array(expert_profile.knowledge_base_links).reject(&:blank?)
    return nil if urls.empty?

    contents = []
    successful_urls = []

    urls.each do |url|
      result = UrlContentFetcher.call(url)

      if result[:success] && result[:content].present?
        contents << "=== Content from #{url} ===\n#{result[:content]}\n"
        successful_urls << url
      else
        Rails.logger.warn("Failed to fetch #{url}: #{result[:error]}")
      end
    end

    return nil if contents.empty?

    full_content = contents.join("\n\n")
    summary = summarize_faq_content(full_content)

    {
      # Fall back to full content if summarization fails for any reason
      content: summary.presence || full_content,
      urls: successful_urls
    }
  end

  # Cache fetched FAQ content per expert + KB links fingerprint so we don't
  # re-scrape the same URLs on every auto-FAQ trigger.
  def cached_faq_content
    expert_profile = @conversation.assigned_expert.expert_profile
    urls = Array(expert_profile.knowledge_base_links).reject(&:blank?)
    return nil if urls.empty?

    links_fingerprint = Digest::SHA256.hexdigest(urls.join("|"))[0, 16]
    cache_key = "auto_faq:faq_content:expert:#{expert_profile.user_id}:#{links_fingerprint}"

    Rails.cache.fetch(cache_key, expires_in: 12.hours) do
      Rails.logger.info("[AUTO_FAQ CACHE MISS] Fetching KB content for expert #{expert_profile.user_id}")
      fetch_faq_content
    end
  end

  # Use the LLM once per expert/KB-links fingerprint to condense the raw
  # scraped content into a shorter summary we can reuse for all auto-FAQ calls.
  def summarize_faq_content(full_content)
    system_prompt = <<~PROMPT.strip
      You are summarizing technical documentation for use by a separate FAQ bot.
      Your job is to extract the key facts, steps, configuration details, and constraints
      from the content and condense them into a concise reference.

      Rules:
      - Do NOT add any information that is not present in the original text.
      - Prefer bullet points or short paragraphs.
      - Keep it relatively short but information-dense.
    PROMPT

    user_prompt = <<~PROMPT.strip
      Here is documentation / knowledge base content:

      #{full_content}

      ---

      Summarize this into a compact reference that another model can later use
      to answer user questions. Focus on preserving important details and steps,
      not on being conversational.
    PROMPT

    result = @bedrock_client.call(
      system_prompt: system_prompt,
      user_prompt: user_prompt
    )

    result[:output_text]&.strip
  rescue StandardError => e
    Rails.logger.error("AutoFaqResponder KB summarization failed: #{e.class}: #{e.message}")
    nil
  end

  def get_llm_answer(faq_content)
    result = @bedrock_client.call(
      system_prompt: build_system_prompt,
      user_prompt: build_user_prompt(faq_content)
    )

    result[:output_text]&.strip
  end

  def build_system_prompt
    <<~PROMPT.strip
      You are a friendly FAQ bot helping users with questions. Answer based ONLY on the provided FAQ content.

      RESPONSE FORMAT (if you can answer):
      - Start conversationally: "Have you tried..." or "You might want to try..."
      - Keep it brief (2-3 sentences max)
      - Be friendly and encouraging
      - Format as helpful suggestions, not definitive answers

      RULES:
      1. ONLY answer if the FAQ contains relevant information
      2. If the FAQ does NOT have enough information, respond with EXACTLY: #{UNABLE_MARKER}
      3. Do NOT make up information or use outside knowledge
      4. Do NOT mention URLs or resources (they will be added separately)

      If you CANNOT answer from the FAQ: Respond with only the word: #{UNABLE_MARKER}
    PROMPT
  end

  def build_user_prompt(faq_content)
    <<~PROMPT.strip
      FAQ/Knowledge Base Content:
      #{faq_content}

      ===

      Conversation Title: #{@conversation.title}

      User Question: #{@message.content}

      ===

      Based on the FAQ content above, can you answer this question?
      If yes, provide a helpful answer (2-4 sentences).
      If no, respond with: #{UNABLE_MARKER}
    PROMPT
  end

  def unable_to_answer?(answer)
    answer.match?(/\A#{UNABLE_MARKER}\z/i) ||
    answer.include?(UNABLE_MARKER) ||
    answer.downcase.include?("i cannot") ||
    answer.downcase.include?("i can't")
  end

  def create_faq_message(answer, urls)
    expert_name = @conversation.assigned_expert.username

    # Build friendly intro
    intro = "🤖 Hey! I'm a bot here to help you with some resources from #{expert_name}'s knowledge base.\n\n"

    # Add the LLM's answer
    content = intro + answer

    # Add resource links
    if urls.any?
      content += "\n\n📚 For more info, check out "
      if urls.length == 1
        content += "this resource: #{urls.first}"
      else
        content += "these resources:\n"
        urls.each { |url| content += "• #{url}\n" }
      end
    end

    # Add friendly closer
    content += "\n\nFeel free to keep chatting with #{expert_name} if you need more help!"

    Message.create!(
      conversation: @conversation,
      sender: @conversation.assigned_expert,
      sender_role: 'expert',
      content: content
    )
  end

  def default_bedrock_client
    model_id = ENV.fetch("BEDROCK_MODEL_ID", "anthropic.claude-3-5-haiku-20241022-v1:0")
    BedrockClient.new(model_id: model_id)
  end
end
