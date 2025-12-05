# frozen_string_literal: true

require "aws-sdk-bedrockruntime"

class BedrockClient
  # Simple wrapper for calling an LLM on Amazon Bedrock (Converse API).
  #
  # Usage:
  #
  #   client = BedrockClient.new(
  #     model_id: "anthropic.claude-3-5-haiku-20241022-v1:0",
  #     region: "us-west-2"
  #   )
  #
  #   response = client.call(
  #     system_prompt: "You are a helpful assistant.",
  #     user_prompt:   "Explain eventual consistency in simple terms."
  #   )
  #
  #   puts response[:output_text]
  #
  def initialize(model_id:, region: ENV["AWS_REGION"] || "us-west-2")
    @model_id = model_id
    @client   = Aws::BedrockRuntime::Client.new(region: region)
  end

  # Calls the LLM with the given system and user prompts.
  #
  # Params:
  # - system_prompt: String
  # - user_prompt:   String
  # - max_tokens:    Integer (optional)
  # - temperature:   Float   (optional)
  #
  # Returns a Hash like:
  # {
  #   output_text: "model response...",
  #   raw_response: <Aws::BedrockRuntime::Types::ConverseResponse>
  # }
  #
  def call(system_prompt:, user_prompt:, max_tokens: 1024, temperature: 0.7)

    if should_fake_llm_call?
      sleep(rand(0.8..3.5)) # Simulate a delay
      return {
        output_text: "This is a fake response from the LLM.",
        raw_response: nil
      }
    end

    response = @client.converse(
      model_id: @model_id,
      messages: [
        {
          role: "user",
          content: [
            { text: user_prompt }
          ]
        }
      ],
      system: [
        {
          text: system_prompt
        }
      ],
      inference_config: {
        max_tokens: max_tokens,
        temperature: temperature
      }
    )

    output_text = extract_text_from_converse_response(response)

    {
      output_text: output_text,
      raw_response: response
    }
  rescue Aws::BedrockRuntime::Errors::ServiceError => e
    # You can customize error handling however you like.
    raise "Bedrock LLM call failed: #{e.message}"
  end

  private

  def should_fake_llm_call?
    !(ENV["ALLOW_BEDROCK_CALL"] == "true") or Current.might_be_locust_request
  end

  # Converse can return multiple content blocks; we’ll just join all text.
  def extract_text_from_converse_response(response)
    return "" unless response&.output&.message&.content

    response.output.message.content
            .select { |c| c.respond_to?(:text) && c.text }
            .map(&:text)
            .join("\n")
  end
end


