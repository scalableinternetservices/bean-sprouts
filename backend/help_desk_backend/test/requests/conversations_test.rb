require "test_helper"

class ConversationsTest < ActionDispatch::IntegrationTest
  def setup
    @user = User.create!(username: "testuser", password: "password123")
    @token = JwtService.encode(@user)
  end

  test "GET /conversations returns user's conversations" do
    conversation = Conversation.create!(title: "Test Conversation", initiator: @user, status: "waiting")
    get "/conversations", headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :ok
    assert_equal 1, JSON.parse(response.body).length
  end

  test "POST /conversations creates a new conversation" do
    post "/conversations",
         params: { title: "Test Conversation" },
         headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :created
    assert_equal "Test Conversation", JSON.parse(response.body)["title"]
  end

  test "GET /conversations requires authentication" do
    get "/conversations"
    assert_response :unauthorized
  end

  test "POST /conversations requires authentication" do
    post "/conversations", params: { title: "Test" }
    assert_response :unauthorized
  end

  test "GET /conversations/:id returns specific conversation" do
    conversation = Conversation.create!(title: "Test Conversation", initiator: @user, status: "waiting")
    get "/conversations/#{conversation.id}", headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_equal conversation.id.to_s, response_data["id"]
    assert_equal @user.id.to_s, response_data["questionerId"]
  end

  test "GET /conversations/:id requires user to own conversation" do
    other_user = User.create!(username: "otheruser", password: "password123")
    conversation = Conversation.create!(title: "Other Conversation", initiator: other_user, status: "waiting")
    get "/conversations/#{conversation.id}", headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :not_found
  end

  test "POST /conversations requires title" do
    post "/conversations",
         params: {},
         headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"], "Title can't be blank"
  end

  test "GET /conversations includes questionerUsername" do
    conversation = Conversation.create!(title: "Test Conversation", initiator: @user, status: "waiting")
    get "/conversations", headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_equal @user.username, response_data.first["questionerUsername"]
  end

  test "GET /conversations includes assignedExpertUsername when expert is assigned" do
    expert_user = User.create!(username: "expertuser", password: "password123")
    expert = ExpertProfile.create!(user: expert_user, bio: "Expert developer", knowledge_base_links: [])
    conversation = Conversation.create!(title: "Test Conversation", initiator: @user, assigned_expert: expert.user, status: "active")
    get "/conversations", headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_equal expert.user.username, response_data.first["assignedExpertUsername"]
  end

  test "GET /conversations includes null assignedExpertUsername when no expert assigned" do
    conversation = Conversation.create!(title: "Test Conversation", initiator: @user, assigned_expert: nil, status: "waiting")
    get "/conversations", headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_nil response_data.first["assignedExpertUsername"]
  end

  test "GET /conversations/:id includes questionerUsername and assignedExpertUsername" do
    expert_user = User.create!(username: "expertuser2", password: "password123")
    expert = ExpertProfile.create!(user: expert_user, bio: "Expert developer", knowledge_base_links: [])
    conversation = Conversation.create!(title: "Test Conversation", initiator: @user, assigned_expert: expert.user, status: "active")
    get "/conversations/#{conversation.id}", headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :ok
    response_data = JSON.parse(response.body)
    assert_equal @user.username, response_data["questionerUsername"]
    assert_equal expert.user.username, response_data["assignedExpertUsername"]
  end

  test "POST /conversations response includes questionerUsername" do
    post "/conversations",
         params: { title: "Test Conversation" },
         headers: { "Authorization" => "Bearer #{@token}" }
    assert_response :created
    response_data = JSON.parse(response.body)
    assert_equal @user.username, response_data["questionerUsername"]
    assert_nil response_data["assignedExpertUsername"]
  end
end
