class HealthController < ApplicationController
    # no authentication needed for health check
    # skip_before_action :verify_authenticity_token, only: [:check]

    def check
        render json: {
        status: 'ok',   # http 200
        timestamp: Time.current.iso8601
        }, status: :ok
    end
end
