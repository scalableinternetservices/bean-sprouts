class ConversationsController < ApplicationController
    before_action :require_authentication

    # GET /conversations
    def index
        # get conversations where uesr is initiator or assigned expert
        conversations = Conversation.where(initiator_id: current_user.id)
                        .or(Conversation.where(assigned_expert_id: current_user.id))
                        .order(updated_at: :desc)
        
        render json: conversations.map { |c| conversation_response(c) }, status: :ok
    end

    # GET /conversations/:id
    def show
        # users can only see their own conversations
        conversation = Conversation.where(initiator_id: current_user.id)
                        .or(Conversation.where(assigned_expert_id: current_user.id))
                        .find_by(id: params[:id])

        unless conversation # if conversation not found
            render json: {
                error: 'Conversation not found'
            }, status: :not_found
            return
        end

        render json: conversation_response(conversation), status: :ok
    end

    # POST /conversations
    def create
        conversation = current_user.conversations_as_initiator.new(conversation_params)

        if conversation.save
            # Try to auto-assign an expert using the LLM. If this fails for any reason,
            # we fall back to the normal "unassigned / waiting" flow.
            AutoExpertAssigner.call(conversation)

            render json: conversation_response(conversation), status: :created
        else
            render json: {
                errors: conversation.errors.full_messages
            }, status: :unprocessable_entity
        end
    end

    private

    def conversation_params
        params.permit(:title)
    end

    def conversation_response(conversation)
        {
            id: conversation.id.to_s,
            title: conversation.title,
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

    def unread_count_for(conversation)
        # messages not sent by current user and not read
        conversation.messages
                    .where.not(sender_id: current_user.id)
                    .where(is_read:false)
                    .count
    end

end
