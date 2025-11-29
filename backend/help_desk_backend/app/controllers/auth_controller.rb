class AuthController < ApplicationController

    # skip_before_action      :verify_authenticity_token
    before_action           :require_authentication, only: [:me]

    # POST /auth/register
    def register
        user = User.new(user_params)

        if user.save
            # auto-create expert profile for all new users
            user.create_expert_profile(bio: "", knowledge_base_links: [])
            #  ^ moved back from User model

            user.update_last_active!
            token = JwtService.encode(user)

            session[:user_id] = user.id

            render json: {
                user: user_response(user),
                token: token
            }, status: :created
        else
            render json: { 
                errors: user.errors.full_messages 
            }, status: :unprocessable_entity
        end
    end

    # POST /auth/login
    def login
        user = User.find_by(username: params[:username]&.downcase&.strip)

        if user&.authenticate(params[:password])
            user.update_last_active!
            token = JwtService.encode(user)
        
            session[:user_id] = user.id

            render json: {
                user: user_response(user),
                token: token
            }, status: :ok
        else
            render json: {
                error: 'Invalid username or password'
            }, status: :unauthorized
        end
    end

    # POST /auth/logout
    def logout
        reset_session
        render json: {
            message: 'Logged out successfully'
        }, status: :ok
    end

    # POST /auth/refresh
    def refresh
        # only allow refresh with session, not jwt token
        user = User.find_by(id: session[:user_id]) if session[:user_id]

        if user
            user.update_last_active!
            token = JwtService.encode(user)

            render json: {
                user: user_response(user),
                token: token
            }, status: :ok
        else
            render json: {
                error: 'No session found'
            }, status: :unauthorized
        end
    end

    # GET /auth/me
    def me
        user = current_user

        if user
            render json: user_response(user), status: :ok
        else
            render json: {
                error: 'No session found'
            }, status: :unauthorized
        end
    end

    private # helpers

    def user_params
        params.permit(:username, :password)
    end

    def user_response(user)
        {
            id: user.id,
            username: user.username,
            created_at: user.created_at.iso8601,
            last_active_at: user.last_active_at&.iso8601
        }
    end

end
