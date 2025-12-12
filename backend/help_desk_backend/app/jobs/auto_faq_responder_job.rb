class AutoFaqResponderJob < ApplicationJob
  queue_as :default
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  
  def perform(conversation_id, message_id)
    conversation = Conversation.find_by(id: conversation_id)
    message = Message.find_by(id: message_id)
    
    return unless conversation && message
    
    AutoFaqResponder.call(conversation, message)
  rescue StandardError => e
    Rails.logger.error("AutoFaqResponderJob failed for conversation #{conversation_id}, message #{message_id}: #{e.class}: #{e.message}")
    raise
  end
end
