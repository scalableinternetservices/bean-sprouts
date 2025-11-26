require "test_helper"

class AuthTest < ActionDispatch::IntegrationTest
  test "POST /auth/register creates a new user and returns token" do
    post "/auth/register", params: { username: "test", password: "password" }
    assert_response :created
    response_data = JSON.parse(response.body)
    assert response_data.key?("user")
    assert response_data.key?("token")
  end

  test "POST /auth/register automatically creates expert profile" do
    assert_difference([ "User.count", "ExpertProfile.count" ], 1) do
      post "/auth/register", params: { username: "newexpert", password: "password" }
    end
    assert_response :created

    user = User.find_by(username: "newexpert")
    assert_not_nil user.expert_profile
  end

  test "POST /auth/login authenticates user and returns token" do
    user = User.create!(username: "test", password: "password")
    post "/auth/login", params: { username: "test", password: "password" }
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data.key?("user")
    assert response_data.key?("token")
  end

  test "POST /auth/login fails with invalid credentials" do
    user = User.create!(username: "test", password: "password")
    post "/auth/login", params: { username: "test", password: "wrongpassword" }
    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert response_data.key?("error")
  end

  test "POST /auth/register fails with duplicate username" do
    User.create!(username: "test", password: "password")
    post "/auth/register", params: { username: "test", password: "password2" }
    assert_response :unprocessable_entity
    response_data = JSON.parse(response.body)
    assert response_data.key?("errors")
  end

  test "POST /auth/logout returns success message" do
    post "/auth/logout"
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_equal "Logged out successfully", response_data["message"]
  end

  test "POST /auth/logout destroys session" do
    user = User.create!(username: "testuser", password: "password123")
    # Login to create session
    post "/auth/login", params: { username: user.username, password: "password123" }
    assert_response :ok

    # Verify session works
    get "/auth/me"
    assert_response :ok

    assert_equal 1, ActiveRecord::SessionStore::Session.count
    original_session_db_id = ActiveRecord::SessionStore::Session.first.session_id

    # Logout
    post "/auth/logout"
    assert_response :ok

    # Make sure the old session is destroyed
    assert_equal 1, ActiveRecord::SessionStore::Session.count
    assert_not_equal original_session_db_id, ActiveRecord::SessionStore::Session.first.session_id

    # Verify session is destroyed
    get "/auth/me"
    assert_response :unauthorized
  end

  test "POST /auth/refresh returns new token with valid session" do
    user = User.create!(username: "testuser2", password: "password123")
    # Simulate login to set session
    post "/auth/login", params: { username: user.username, password: "password123" }
    assert_response :ok

    sleep 1 # Ensure different timestamp for new token
    post "/auth/refresh"
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert response_data.key?("user")
    assert response_data.key?("token")
  end

  test "POST /auth/refresh fails without session" do
    post "/auth/refresh"
    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert response_data.key?("error")
  end

  test "POST /auth/refresh fails with valid JWT token but no session" do
    user = User.create!(username: "testuser3", password: "password123")
    # Create a valid JWT token
    token = JwtService.encode(user)

    # Try to refresh using JWT token in Authorization header (should fail)
    post "/auth/refresh", headers: { "Authorization" => "Bearer #{token}" }
    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert_equal "No session found", response_data["error"]
  end

  test "GET /auth/me returns current user with session" do
    user = User.create!(username: "testuser4", password: "password123")
    # Simulate login to set session
    post "/auth/login", params: { username: user.username, password: "password123" }
    assert_response :ok

    get "/auth/me"
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_equal user.id, response_data["id"]
    assert_equal user.username, response_data["username"]
  end

  test "GET /auth/me fails without session" do
    get "/auth/me"
    assert_response :unauthorized
    response_data = JSON.parse(response.body)
    assert response_data.key?("error")
  end
end
