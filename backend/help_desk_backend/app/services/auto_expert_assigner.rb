class AutoExpertAssigner
  def self.call(conversation)
    new(conversation).call
  end

  def initialize(conversation, bedrock_client: default_bedrock_client)
    @conversation = conversation
    @bedrock_client = bedrock_client
  end

  def call
    experts = eligible_experts
    return if experts.empty?

    question_text = @conversation.title.to_s.strip
    return if question_text.empty?

    system_prompt = build_system_prompt
    user_prompt   = build_user_prompt(question_text, experts)

    result = @bedrock_client.call(
      system_prompt: system_prompt,
      user_prompt:   user_prompt
    )

    expert_id = parse_expert_id(result[:output_text], experts.map(&:id))

    expert =
      if expert_id
        User.find_by(id: expert_id)
      else
        # Fallback: if we couldn't parse a valid expert_id from the LLM,
        # just choose the first eligible expert.
        experts.first
      end

    return unless expert

    # Assign on the Conversation and record an ExpertAssignment, mirroring manual claim behavior
    if @conversation.assign_expert(expert)
      ExpertAssignment.create!(
        conversation: @conversation,
        expert: expert
      )
    end
  rescue StandardError => e
    Rails.logger.error("AutoExpertAssigner failed: #{e.class}: #{e.message}")
    nil
  end

  private

  def eligible_experts
    User.joins(:expert_profile)
        .where.not(expert_profiles: { bio: [nil, ""] })
  end

  def build_system_prompt
    <<~PROMPT.strip
      You are an expert router. Your job is to look at a user's question and a list of experts
      (each with an id, username, and bio) and pick the single best expert to answer the question.

      Respond with ONLY the integer expert_id (for example: 12). Do not include any other text.
    PROMPT
  end

  def build_user_prompt(question_text, experts)
    lines = []
    lines << "Question:"
    lines << question_text
    lines << ""
    lines << "Experts (with bios and knowledge base links):"

    experts.each do |expert|
      profile = expert.expert_profile
      bio = profile&.bio.to_s.gsub(/\s+/, " ").strip
      links = Array(profile&.knowledge_base_links).map(&:to_s).reject(&:empty?)
      links_str = links.empty? ? "none" : links.join(", ")

      lines << "ID=#{expert.id} USERNAME=#{expert.username} BIO=\"#{bio}\" KNOWLEDGE_BASE_LINKS=\"#{links_str}\""
    end

    lines << ""
    lines << "Based on BOTH the bios and the knowledge base links, which expert_id is the best match for this question?"
    lines.join("\n")
  end

  def parse_expert_id(output_text, allowed_ids)
    return nil if output_text.nil?

    match = output_text.to_s.scan(/\d+/).first
    return nil unless match

    expert_id = match.to_i
    return expert_id if allowed_ids.include?(expert_id)

    nil
  end

  def default_bedrock_client
    model_id = ENV.fetch("BEDROCK_MODEL_ID", "anthropic.claude-3-5-haiku-20241022-v1:0")
    BedrockClient.new(model_id: model_id)
  end
end


