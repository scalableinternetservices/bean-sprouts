class Message < ApplicationRecord

    # associations
    belongs_to  :conversation
    belongs_to  :sender, class_name: 'User', foreign_key: 'sender_id'

    # validations
    validates   :conversation_id, presence: true
    validates   :sender_id, presence: true
    validates   :sender_role, presence: true, inclusion: { in: %w[initiator expert] }
    validates   :content, presence:true

    # callbacks
    after_create    :update_conversation_timestamp
        # automatically update conversation's last_message_at when a message is created

    # instance methods
    def mark_as_read!   # used in API endpoint
        update(is_read: true)
    end

    private

    def update_conversation_timestamp
        conversation.touch(:last_message_at)
    end
    
end
