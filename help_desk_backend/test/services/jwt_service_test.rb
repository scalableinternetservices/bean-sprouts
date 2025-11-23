require "test_helper"

class JwtServiceTest < ActiveSupport::TestCase
  def setup
    @user = User.create!(username: "testuser", password: "password123")
  end

  test "generates a valid JWT token" do
    token = JwtService.encode(@user)
    assert token.present?
  end

  test "decodes a valid token" do
    token = JwtService.encode(@user)
    decoded = JwtService.decode(token)
    assert_equal @user.id, decoded[:user_id]
  end
end
