require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module HelpDeskBackend
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # cookie_configuration_test.rb expects:
        # Development: samesite=lax, secure=false
        # Test: samesite=none, secure=false
        # Production: samesite=none, secure=true
    same_site_value = Rails.env.development? ? :lax : :none
    secure_value = Rails.env.production?

    # Added during Project "Session Configuration"
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::ActiveRecordStore, {
      expire_after: 24.hours,
      same_site: Rails.env.development? ? :lax : :none,
      secure: Rails.env.production?,
      httponly: true # added for cookie_configuration_test.rb: assert_includes set_cookie_header, "httponly"
    }

    # Added during Project "CORS Configuration"
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ]
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true
      end
    end
  end
end
