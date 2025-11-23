class ApplicationController < ActionController::API
    include ActionController::Cookies

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

end
