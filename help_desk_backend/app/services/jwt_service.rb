class JwtService
  SECRET_KEY = Rails.application.credentials.secret_key_base || "development_secret_key"

  def self.encode(user)
    payload = {
      user_id: user.id,
      exp: 15.minutes.from_now.to_i
    }
    JWT.encode(payload, SECRET_KEY, "HS256")
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })
    decoded[0].symbolize_keys
  rescue JWT::DecodeError => e
    Rails.logger.error "JWT decode error: #{e.message}"
    nil
  end
end
