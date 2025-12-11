class UpdatesController < ApplicationController
    include ActionController::Live

    before_action :require_authentication

    # Disable request logging for SSE stream to reduce log spam
    around_action :silence_stream_logging, only: [:stream]

    # GET /api/conversations/updates
    def conversations
        user_id = params[:userId]
        since = params[:since]

        # user can only request their own updates
        unless current_user.id.to_s == user_id
            render json: {
                error: 'Unauthorized'
            }, status: :unauthorized
            return
        end

        # get user's conversations
        user_conversations = Conversation.where(initiator_id: current_user.id)
                                            .or(Conversation.where(assigned_expert_id: current_user.id))
                    
        # filter using optional parameter
        if since.present?
            begin
                since_time = Time.iso8601(since)
                user_conversations = user_conversations.where('updated_at > ?', since_time)
            rescue ArgumentError
                render json: {
                    error: 'Invalid timestamp format'
                }, status: :bad_request
                return
            end
        end

        conversations = user_conversations.order(updated_at: :desc)
        
        render json: conversations.map { |c| conversation_response(c) }, status: :ok
    end

    # GET /api/messages/updates
    def messages
        user_id = params[:userId]
        since = params[:since]

        # user can only request their own updates
        unless current_user.id.to_s == user_id
            render json: {
                error: 'Unauthorized'
            }, status: :unauthorized
            return
        end

        user_conversation_ids = Conversation.where(initiator_id: current_user.id)
                                            .or(Conversation.where(assigned_expert_id: current_user.id))
                                            .pluck(:id)

        user_messages = Message.where(conversation_id: user_conversation_ids)

        # filter using optional parameter
        if since.present?
            begin
                since_time = Time.iso8601(since)
                user_messages = user_messages.where('created_at > ?', since_time)
            rescue ArgumentError
                render json: {
                    error: 'Invalid timestamp format'
                }, status: :bad_request
                return
            end
        end

        messages = user_messages.order(created_at: :asc)

        render json: messages.map { |m| message_response(m) }, status: :ok
    
    end

    # GET /api/expert-queue/updates
    def expert_queue
        expert_id = params[:expertId]
        since = params[:since]

        # user can only request their own updates
        unless current_user.id.to_s == expert_id
            render json: {
                error: 'Unauthorized'
            }, status: :unauthorized
            return
        end

        # user must have expert profile -- but this should be auto-generated
        unless current_user.expert?
            render json: {
                error: 'Expert profile required'
            }, status: :forbidden
            return
        end

        # get user's expert conversations
        waiting_conversations = Conversation.where(status: 'waiting')
        assigned_conversations = Conversation.where(assigned_expert_id: current_user.id)
                                                .where(status: 'active')

        if since.present?
            begin
                since_time = Time.iso8601(since)
                waiting_conversations = waiting_conversations.where('updated_at > ?', since_time)
                assigned_conversations = assigned_conversations.where('updated_at > ?', since_time)
            rescue ArgumentError
                render json: {
                    error: 'Invalid timestamp format'
                }, status: :bad_request
                return
            end
        end

        waiting = waiting_conversations.order(created_at: :asc)
        assigned = assigned_conversations.order(last_message_at: :desc)

        render json: [{
            waitingConversations: waiting.map {|c| conversation_response(c) },
            assignedConversations: assigned.map {|c| conversation_response(c) }
        }], status: :ok

    end

    # GET /api/updates/stream - SSE endpoint for real-time updates
    def stream
        response.headers['Content-Type'] = 'text/event-stream'
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'

        last_check = Time.current

        begin
            loop do
                current_time = Time.current

                ActiveRecord::Base.connection_pool.with_connection do
                    # Conversation updates
                    conversation_updates = get_conversation_updates_since(current_user, last_check)
                    conversation_updates.each do |conv|
                        write_sse_event('conversation-update', conversation_response(conv))
                    end

                    # Message updates
                    message_updates = get_message_updates_since(current_user, last_check)
                    message_updates.each do |msg|
                        write_sse_event('message-update', message_response(msg))
                    end

                    # Expert queue updates
                    if current_user.expert?
                        queue_update = get_expert_queue_updates_since(current_user, last_check)
                        write_sse_event('expert-queue-update', queue_update) if queue_update
                    end
                end

                last_check = current_time
                write_sse_event('heartbeat', {timestamp: Time.current.iso8601})

                sleep 2
            end
        rescue IOError
            # Client disconnected
        ensure
            response.stream.close rescue nil
        end
    end


    private

    def conversation_response(conversation)
        {
            id: conversation.id.to_s,
            title: conversation.title,
            summary: conversation.summary || first_message_excerpt(conversation),
            status: conversation.status,
            questionerId: conversation.initiator_id.to_s,
            questionerUsername: conversation.initiator.username,
            assignedExpertId: conversation.assigned_expert_id&.to_s,
            assignedExpertUsername: conversation.assigned_expert&.username,
            createdAt: conversation.created_at.iso8601,
            updatedAt: conversation.updated_at.iso8601,
            lastMessageAt: conversation.last_message_at&.iso8601,
            unreadCount: unread_count_for(conversation)
        }
    end

    def first_message_excerpt(conversation)
      first_msg = conversation.messages.order(created_at: :asc).first
      first_msg&.content&.truncate(100) || "No messages yet"
    end

    def unread_count_for(conversation)
        # messages not sent by current user and not read
        conversation.messages
                    .where.not(sender_id: current_user.id)
                    .where(is_read: false)
                    .count
    end

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

    def write_sse_event(event_name, data)
        response.stream.write("event: #{event_name}\n")
        response.stream.write("data: #{data.to_json}\n\n")
    rescue IOError
        raise
    end

    def get_conversation_updates_since(user, since_time)
        Conversation.where(initiator_id: user.id)
                   .or(Conversation.where(assigned_expert_id: user.id))
                   .where('updated_at > ?', since_time)
                   .order(updated_at: :desc)
    end

    def get_message_updates_since(user, since_time)
        user_conversation_ids = Conversation.where(initiator_id: user.id)
                                           .or(Conversation.where(assigned_expert_id: user.id))
                                           .pluck(:id)

        Message.where(conversation_id: user_conversation_ids)
              .where('created_at > ?', since_time)
              .order(created_at: :asc)
    end

    def get_expert_queue_updates_since(user, since_time)
        waiting = Conversation.where(status: 'waiting')
                             .where('updated_at > ?', since_time)
                             .order(created_at: :asc)

        assigned = Conversation.where(assigned_expert_id: user.id)
                              .where(status: 'active')
                              .where('updated_at > ?', since_time)
                              .order(last_message_at: :desc)

        if waiting.any? || assigned.any?
            {
                waitingConversations: waiting.map {|c| conversation_response(c) },
                assignedConversations: assigned.map {|c| conversation_response(c) }
            }
        else
            nil
        end
    end

    def silence_stream_logging
        Rails.logger.silence do
            yield
        end
    end

end
