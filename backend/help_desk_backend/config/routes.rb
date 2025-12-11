Rails.application.routes.draw do
  # health check endpoint
  get '/health', to: 'health#check'
    # defines a GET endpoint at /health
    # routes to HealthController#check action

  # authentication routes
  post '/auth/register', to: 'auth#register'
  post '/auth/login', to: 'auth#login'
  post '/auth/logout', to: 'auth#logout'
  post '/auth/refresh', to: 'auth#refresh'
  get '/auth/me', to: 'auth#me'

  # conversations routes
  get '/conversations', to: 'conversations#index'
  get '/conversations/:id', to: 'conversations#show'
  post '/conversations', to: 'conversations#create'

  # messages routes
  get '/conversations/:conversation_id/messages', to: 'messages#index'
  post '/messages', to: 'messages#create'
  put '/messages/:id/read', to: 'messages#mark_read'

  # expert routes
  get '/expert/queue', to: 'expert#queue'
  get '/expert/profile', to: 'expert#profile'
  put '/expert/profile', to: 'expert#update_profile'
  get '/expert/assignments/history', to: 'expert#assignments_history'

  post '/expert/conversations/:conversation_id/claim', to: 'expert#claim'
  post '/expert/conversations/:conversation_id/unclaim', to: 'expert#unclaim'

  # updates/polling routes
  get '/api/conversations/updates', to: 'updates#conversations'
  get '/api/messages/updates', to: 'updates#messages'
  get '/api/expert-queue/updates', to: 'updates#expert_queue'

  # SSE streaming route
  get '/api/updates/stream', to: 'updates#stream'
  
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
