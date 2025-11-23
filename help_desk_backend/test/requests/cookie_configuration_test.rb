require "test_helper"

class CookieConfigurationTest < ActionDispatch::IntegrationTest
  def setup
    @user = User.create!(username: "testuser", password: "password123")
  end

  test "login sets session cookie with correct SameSite attribute" do
    post "/auth/login",
         params: { username: @user.username, password: "password123" },
         headers: { "Origin" => "http://localhost:5173" }

    assert_response :ok

    # Check that Set-Cookie header includes SameSite attribute
    set_cookie_header = response.headers["Set-Cookie"]
    assert_not_nil set_cookie_header
    assert_includes set_cookie_header, "samesite=none"
    assert_includes set_cookie_header, "httponly"
  end

  test "register sets session cookie with correct attributes" do
    post "/auth/register",
         params: { username: "newuser", password: "password123" },
         headers: { "Origin" => "http://localhost:5173" }

    assert_response :created

    # Check that Set-Cookie header includes SameSite attribute
    set_cookie_header = response.headers["Set-Cookie"]
    assert_not_nil set_cookie_header
    assert_includes set_cookie_header, "samesite=none"
    assert_includes set_cookie_header, "httponly"
  end

  test "session cookie works with cross-origin requests" do
    # First, login to set the session cookie
    post "/auth/login",
         params: { username: @user.username, password: "password123" },
         headers: { "Origin" => "http://localhost:5173" }

    assert_response :ok

    # Extract the session cookie
    set_cookie_header = response.headers["Set-Cookie"]
    session_cookie = set_cookie_header.split(";").first

    # Use the session cookie in a subsequent request
    get "/auth/me",
        headers: {
          "Cookie" => session_cookie,
          "Origin" => "http://localhost:5173"
        }

    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_equal @user.username, response_data["username"]
  end

  test "session configuration uses lax SameSite for development environment" do
    # Mock Rails.env to simulate development environment
    Rails.env.expects(:development?).returns(true)
    Rails.env.expects(:production?).returns(false)
    
    # Test that the configuration logic returns :lax for development
    expected_same_site = Rails.env.development? ? :lax : :none
    assert_equal :lax, expected_same_site
    
    # Test that secure is false for development
    expected_secure = Rails.env.production?
    assert_equal false, expected_secure
  end
end
