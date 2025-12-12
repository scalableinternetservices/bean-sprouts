class MessagesController < ApplicationController
    before_action :require_authentication
    # before_action :set_message, only: [:mark_read]

    # GET /conversations/:conversation_id/messages
    def index
        conversation = Conversation.find_by(id: params[:conversation_id])

        unless conversation
            render json: { error: 'Conversation not found' }, status: :not_found
            return
        end

        cache_key = "messages:index:conversation:#{conversation.id}"

        json_response = Rails.cache.fetch(cache_key, expires_in: 10.seconds) do
            Rails.logger.info("[CACHE MISS] messages:index for conversation #{conversation.id}")
            messages = conversation.messages.includes(:sender).order(created_at: :asc)
            messages.map { |m| message_response(m) }
        end

        render json: json_response, status: :ok
    end

    # POST /messages
    def create
        conversation = Conversation.where(initiator_id: current_user.id)
                        .or(Conversation.where(assigned_expert_id: current_user.id))
                        .find_by(id: params[:conversationId])
    
        unless conversation
            render json: { 
                error: 'Conversation not found' 
            }, status: :not_found
            return
        end

        # determine sender's role based on user's relationship to conversation
        sender_role = conversation.initiator_id == current_user.id ? 'initiator' : 'expert'

        message = conversation.messages.new(
            sender: current_user,
            sender_role: sender_role,
            content: params[:content]
        )

        if message.save
            # Invalidate caches on write
            Rails.cache.delete("messages:index:conversation:#{conversation.id}")
            Rails.cache.delete("conversations:index:user:#{conversation.initiator_id}")
            Rails.cache.delete("conversations:index:user:#{conversation.assigned_expert_id}") if conversation.assigned_expert_id

            render json: message_response(message), status: :created

            # Trigger auto-FAQ responder (only on first message from initiator)
            # AutoFaqResponder.call(conversation, message)

            # Trigger summarizer (it decides internally whether to update)
            # Updates at: 3 messages (initial), 8/13/18/23... (incremental), resolved (final)
            # ConversationSummarizer.call(conversation)

            # enqueue background jobs instead of blocking
            AutoFaqResponderJob.perform_later(conversation.id, message.id)
            ConversationSummarizerJob.perform_later(conversation.id)
        else
            render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
        end
    end


    # PUT /messages/:id/read
    def mark_read
        message = Message.joins(:conversation)
                            .where(id: params[:id])
                            .where(
                                'conversations.initiator_id = ? OR conversations.assigned_expert_id = ?',
                                    current_user.id,
                                    current_user.id
                            )
                            .first
        
        unless message # message not found
            render json: { 
                error: 'Message not found' 
            }, status: :not_found 
            return
        end

        # can't mark own messages as read
        if message.sender_id == current_user.id
            render json: { 
                error: 'Cannot mark your own messages as read' 
            }, status: :forbidden
            return
        end

        message.mark_as_read!
        render json: {
            success: true
        }, status: :ok

    end

    private

    def message_response(message)
        {
        id: message.id.to_s,
        conversationId: message.conversation_id.to_s,
        senderId: message.sender_id.to_s,
        senderUsername: message.sender.username,
        senderRole: message.sender_role,
        content: message.content,
        timestamp: message.created_at.iso8601,
        isRead: message.is_read
        }
    end
end
