class ExpertController < ApplicationController
    before_action :require_authentication
    before_action :require_expert_profile

    # GET /expert/queue
    def queue

        waiting_conversations = Conversation.where(status: 'waiting')
                                                .order(created_at: :asc)

        assigned_conversations = Conversation.where(assigned_expert_id: current_user.id)
                                                .where(status: 'active')
                                                .order(last_message_at: :desc)
        
        render json: {
            waitingConversations: waiting_conversations.map { |c| conversation_response(c) },
            assignedConversations: assigned_conversations.map { |c| conversation_response(c) }
        }, status: :ok
    end

    # POST /expert/conversations/:conversation_id/claim
    def claim
        # find conversation
        conversation = Conversation.find_by(id: params[:conversation_id])

        unless conversation
            render json: {
                error: 'Conversation not found'
            }, status: :not_found
            return
        end

        # check if conversation has already been assigned
        if conversation.assigned_expert_id.present?
            render json: {
                error: 'Conversation is already assigned to an expert'
            }, status: :unprocessable_entity
            return
        end

        # assign expert
        if conversation.assign_expert(current_user)
            ExpertAssignment.create!(
                conversation: conversation,
                expert: current_user
            )

            render json: { 
                success: true 
            }, status: :ok
        else
            render json: {
                error: 'Failed to claim conversation' 
            }, status: :unprocessable_entity
        end

    end

    # POST /expert/conversations/:conversation_id/unclaim
    def unclaim
        
        # find conversation
        conversation = Conversation.find_by(id: params[:conversation_id])

        unless conversation
            render json: {
                error: 'Conversation not found'
            }, status: :not_found
            return
        end

        # verify that user is actually assigned to this conversation
        unless conversation.assigned_expert_id == current_user.id
            render json: {    
                error: 'You are not assigned to this conversation'
            }, status: :forbidden
            return
        end

        # resolve the current assignment
        # is this the expected behavior?
        assignment = ExpertAssignment.find_by(
            conversation: conversation,
            expert: current_user,
            status: 'active'
        )
        assignment&.resolve!

        # return conversation to waiting queue
        if conversation.unassign_expert
            render json: {
                success: true
            }, status: :ok
        else
            render json: {
                error: 'Failed to unclaim conversation'
            }, status: :unprocessable_entity
        end

    end

    # GET /expert/profile
    def profile
        render json: expert_profile_response(current_user.expert_profile), status: :ok
    end

    # PUT /expert/profile
    def update_profile
        profile = current_user.expert_profile

        if profile.update(bio: params[:bio], knowledge_base_links: params[:knowledgeBaseLinks])
            render json: expert_profile_response(profile), status: :ok
        else
            render json: {
                errors: profile.errors.full_messages
            }, status: :unprocessable_entity
        end

    end

    # GET /expert/assignments/history
    def assignments_history
        cache_key = "expert:assignments:history:expert:#{current_user.id}"

        assignments = Rails.cache.fetch(cache_key, expires_in: 2.minutes) do
            Rails.logger.info("[CACHE MISS] Loading assignments from DB for expert #{current_user.id}")
            ExpertAssignment.where(expert_id: current_user.id)
                            .order(assigned_at: :desc)
                            .to_a
        end

        render json: assignments.map { |a| assignment_response(a) }, status: :ok
    end

    private

    def expert_profile_response(profile)
        {
            id: profile.id.to_s,
            userId: profile.user_id.to_s,
            bio: profile.bio,
            knowledgeBaseLinks: profile.knowledge_base_links,
            createdAt: profile.created_at.iso8601,
            updatedAt: profile.updated_at.iso8601
        }
    end

    def assignment_response(assignment)
        {
            id: assignment.id.to_s,
            conversationId: assignment.conversation_id.to_s,
            expertId: assignment.expert_id.to_s,
            status: assignment.status,
            assignedAt: assignment.assigned_at.iso8601,
            resolvedAt: assignment.resolved_at&.iso8601,
            rating: nil  # included in API specifications but not er diagram
        }
    end

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

    def profile_params
        params.permit(:bio, knowledge_base_links: [])
    end

    def require_expert_profile
        unless current_user.expert?
            render json: { error: 'Expert profile required' }, status: :forbidden
        end
    end

    def unread_count_for(conversation)
        conversation.messages
                    .where.not(sender_id: current_user.id)
                    .where(is_read: false)
                    .count
    end
    
end
