Run in rails bash shell from `help_desk_backend/`

## Provided
- `rails test test/requests/auth_test.rb`
- `rails test test/requests/conversations_test.rb`
- `rails test test/requests/cookie_configuration_test.rb`
- `rails test test/services/jwt_service_test.rb`

## Models
- `rails test test/models/user_test.rb`
- `rails test test/models/conversation_test.rb`
- `rails test test/models/message_test.rb`
- `rails test test/models/expert_profile_test.rb`
- `rails test test/models/expert_assignment_test.rb`
- manual: `rails console`

## Controllers
- `rails test test/controllers/health_controller_test.rb`
- `rails test test/controllers/auth_controller_test.rb`
- `rails test test/controllers/conversations_controller_test.rb`
- `rails test test/controllers/messages_controller_test.rb`
- `rails test test/controllers/expert_controller_test.rb`
- `rails test test/controllers/updates_controller_test.rb`
- manual: `curl` commands
