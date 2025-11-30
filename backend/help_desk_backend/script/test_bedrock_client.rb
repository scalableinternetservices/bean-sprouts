#!/usr/bin/env ruby

require_relative "../config/environment"

puts "Starting BedrockClient test..."

client = BedrockClient.new(
  model_id: "anthropic.claude-3-5-haiku-20241022-v1:0"
)

response = client.call(
  system_prompt: "You are a helpful assistant.",
  user_prompt:   "whats capital of france."
)

puts "BedrockClient response:"
puts response[:output_text]


