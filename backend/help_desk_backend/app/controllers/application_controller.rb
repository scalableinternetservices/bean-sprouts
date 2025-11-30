class ApplicationController < ActionController::API
    include ActionController::Cookies

    before_action :detect_locust_request

    # authentication methods
    def current_user
        if session[:user_id]
            @current_user ||= User.find_by(id: session[:user_id])
        elsif request.headers['Authorization']
            token = request.headers['Authorization'].split(' ').last
            decoded = JwtService.decode(token)  # use JwtService
            @current_user = User.find_by(id: decoded[:user_id]) if decoded
        end
        @current_user
    end

    def require_authentication
        render json: { error: 'Authentication required' }, status: :unauthorized unless current_user
    end

    private

    def detect_locust_request
        ua = request.user_agent.to_s

        if ua.include?("python-requests")
            Current.might_be_locust_request = true
        else
            Current.might_be_locust_request = false
        end
    end
end

