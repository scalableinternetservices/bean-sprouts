class ConversationSummarizerJob < ApplicationJob
  queue_as :default
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  
  def perform(conversation_id)
    conversation = Conversation.find_by(id: conversation_id)
    return unless conversation
    
    ConversationSummarizer.call(conversation)
  rescue StandardError => e
    Rails.logger.error("ConversationSummarizerJob failed for conversation #{conversation_id}: #{e.class}: #{e.message}")
    raise
  end
end
