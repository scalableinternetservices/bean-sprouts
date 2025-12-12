class AutoExpertAssignerJob < ApplicationJob
  queue_as :default
  
  # Retry with exponential backoff for transient failures
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  
  def perform(conversation_id)
    conversation = Conversation.find_by(id: conversation_id)
    return unless conversation
    
    # Only assign if still unassigned
    return if conversation.assigned_expert_id.present?
    
    AutoExpertAssigner.call(conversation)
  rescue StandardError => e
    Rails.logger.error("AutoExpertAssignerJob failed for conversation #{conversation_id}: #{e.class}: #{e.message}")
    raise # Re-raise to trigger retry logic
  end
end
