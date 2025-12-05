class ConversationSummarizer
  def self.call(conversation)
    new(conversation).call
  end

  def initialize(conversation, bedrock_client: default_bedrock_client)
    @conversation = conversation
    @bedrock_client = bedrock_client
  end

  def call
    messages = @conversation.messages.order(created_at: :asc)
    count = messages.count

    # Initial summary at 3 messages
    if count == 3 && @conversation.summary.blank?
      generate_initial_summary(messages.limit(10))

    # Incremental updates every 5 messages (at 8, 13, 18, 23...)
    elsif count >= 8 && (count - 3) % 5 == 0
      update_incrementally(messages.last(5))

    # Final summary when conversation is resolved
    elsif @conversation.status == 'resolved' &&
          (@conversation.summary_updated_at.nil? || @conversation.summary_updated_at < @conversation.updated_at)
      generate_resolution_summary(messages)
    end
  rescue StandardError => e
    Rails.logger.error("ConversationSummarizer failed: #{e.class}: #{e.message}")
    nil
  end

  private

  # Generate initial summary from first messages
  def generate_initial_summary(messages)
    system_prompt = <<~PROMPT.strip
      You are a conversation summarizer. Create a brief 1-2 sentence summary
      of the main question or issue being discussed.

      Focus on WHAT the user needs help with, not who is involved.
      Be concise and informative.
    PROMPT

    user_prompt = build_messages_prompt(messages, "Provide a brief summary of what this conversation is about.")

    result = @bedrock_client.call(
      system_prompt: system_prompt,
      user_prompt: user_prompt
    )

    @conversation.update(
      summary: result[:output_text],
      summary_updated_at: Time.current
    )
  end

  # Update summary with new messages (cost-effective incremental update)
  def update_incrementally(new_messages)
    system_prompt = <<~PROMPT.strip
      You are updating a conversation summary. Given the previous summary and new messages,
      provide an updated 1-2 sentence summary that incorporates important new information.

      If the new messages don't add significant information, keep the summary mostly the same.
      Focus on the core issue and any progress or new developments.
    PROMPT

    user_prompt = <<~PROMPT.strip
      Previous summary: #{@conversation.summary}

      New messages:
      #{format_messages(new_messages)}

      Provide an updated summary (1-2 sentences) that incorporates any important new information.
    PROMPT

    result = @bedrock_client.call(
      system_prompt: system_prompt,
      user_prompt: user_prompt
    )

    @conversation.update(
      summary: result[:output_text],
      summary_updated_at: Time.current
    )
  end

  # Generate final resolution summary
  def generate_resolution_summary(messages)
    system_prompt = <<~PROMPT.strip
      You are summarizing a resolved conversation. Create a brief 1-2 sentence summary
      that describes both the original problem AND how it was resolved.

      Focus on: What was the issue? How was it solved?
      Be concise and informative.
    PROMPT

    user_prompt = build_messages_prompt(messages.last(15), "Summarize both the problem and its resolution.")

    result = @bedrock_client.call(
      system_prompt: system_prompt,
      user_prompt: user_prompt
    )

    @conversation.update(
      summary: result[:output_text],
      summary_updated_at: Time.current
    )
  end

  # Helper to format messages for prompts
  def build_messages_prompt(messages, instruction)
    lines = []
    lines << "Conversation Title: #{@conversation.title}"
    lines << ""
    lines << "Messages:"
    lines << format_messages(messages)
    lines << ""
    lines << instruction
    lines.join("\n")
  end

  def format_messages(messages)
    messages.map do |msg|
      sender_role = msg.sender_id == @conversation.initiator_id ? "User" : "Expert"
      "#{sender_role}: #{msg.content}"
    end.join("\n")
  end
  
  def default_bedrock_client
    model_id = ENV.fetch("BEDROCK_MODEL_ID", "anthropic.claude-3-5-haiku-20241022-v1:0")
    BedrockClient.new(model_id: model_id)
  end
end