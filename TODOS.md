# Project Specifications [HERE](https://cs291.com/project3/)

## Startup
Steps described in project specs.
- [x] Create the Rails app in the container
- [x] Session configuration
- [x] CORS configuration

### Initial Setup
- [x] (one person only) import starter files from provided zip folders
- [ ] (the other person) get the general initial setup configured by the first person: `git pull`
- [ ] ensure Docker Desktop is running on your local host
- [ ] start the container: `docker-compose up -d`
- [ ] start Rails bash shell: `docker-compose exec web bash`
- [x] (one person only) create new Rails application: `rails new help_desk_backend --api --skip-kamal --skip-thruster  --database=mysql`
- [ ] navigate to [backend directory](/help_desk_backend/): `cd help_desk_backend` (next few commands must be run in that folder)
- [x] (one person only) add required gems to [Gemfile](/help_desk_backend/Gemfile)
    ```
    gem "rack-cors" # For handling Cross-Origin Resource Sharing (CORS) requests from the frontend
    gem "jwt" # For JSON Web Token authentication (if you choose JWT over sessions)
    gem "activerecord-session_store" # For database-backed session storage
    group :test do
       gem "mocha"
    end
    ```
- [x] (one person only) add this line to [help_desk_backend/test/test_helper.rb](/help_desk_backend/test/test_helper.rb): `require "mocha/minitest"`
- [ ] install dependencies: `bundle install`
- [ ] create the database: `rails db:create`
- [ ] start server: `rails server -b 0.0.0.0 -p 3000`
- [ ] access application: `http://localhost:3000`
- [x] (one person only) configure database-backed sessions: allows Rails API to maintain user sessions across requests (essential for authentication functionality)
    - [x] generate session migration: `rails generate active_record:session_migration`
    - [x] run the migration: `rails db:migrate`
    - [x] add session middleware in [config/application.rb](/help_desk_backend/config/application.rb)
        ```
        config.middleware.use ActionDispatch::Cookies
        config.middleware.use ActionDispatch::Session::ActiveRecordStore, {
          expire_after: 24.hours,
          same_site: Rails.env.development? ? :lax : :none,
          secure: Rails.env.production?
        }
        ```
- [x] (one person only) configure CORS (`rack-cors` gem) in [config/application.rb](/help_desk_backend/config/application.rb): allows frontend application to make requests to your Rails API when hosted in different domains ([http://localhost:3000](http://localhost:3000) is considered a different domain thatn [http://localhost:5173](http://localhost:5173))
    ```
    # Add this inside the Application class
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
    ```
- [ ] start up frontend from [Project 2](https://github.com/laszlo-tw/f25_cmpsc291a_project2): `npm run dev`
- [ ] access frontend: [http://localhost:5173](http://localhost:5173)
    - [ ] go to [http://localhost:5173/settings](http://localhost:5173/settings)
    - [ ] change Backend Mode to "API (Real Backend)"
    - [ ] set API Base URL to [http://localhost:3000](http://localhost:3000)
    - [ ] save configuration
- [ ] ...
- [ ] stop the container: `docker-compose down`
- [x] (the first person) commit & push changes to Github repo

Note: I had to remove `.git/` in [/help_desk_backend](/help_desk_backend/) in order for Git to work in the main project directory.

### Daily Workflow
- [ ] ensure code is up to date: `git pull`
- [ ] ensure Docker Desktop is running on your local host
- [ ] start the container: `docker-compose up -d`
- [ ] start Rails bash shell: `docker-compose exec web bash`
- [ ] navigate to [backend directory](/help_desk_backend/): `cd help_desk_backend` (next few commands must be run in that folder)
- [ ] run any migrations if necessary: `rails db:migrate`
- [ ] start server: `rails server -b 0.0.0.0 -p 3000`
- [ ] access application: [http://localhost:3000](http://localhost:3000)
- [ ] start up frontend from [Project 2](https://github.com/laszlo-tw/f25_cmpsc291a_project2): `npm run dev`
- [ ] access frontend: [http://localhost:5173](http://localhost:5173)
- [ ] configure the frontend to point to your Rails backend
    - [ ] go to [http://localhost:5173/settings](http://localhost:5173/settings)
    - [ ] change Backend Mode to "API (Real Backend)"
    - [ ] set API Base URL to [http://localhost:3000](http://localhost:3000)
    - [ ] save configuration
- [ ] ...
- [ ] stop the container: `docker-compose down`

## Project
**Rails API Application:** Create a Rails API application that implements all endpoints specified in [`API_SPECIFICATION.md`](API_SPECIFICATION.md).
- [ ] Implement Controllers:
    - [ ] AuthController: Uses session cookie for authentication where needed (register and login do not require auth)
    - [ ] ConversationsController: Uses JWT for token-based authentication
    - [ ] MessagesController: Uses JWT for token-based authentication
    - [ ] HealthController: No authentication necessary
    - [ ] UpdatesController: Uses JWT for token-based authentication
    - [ ] ExpertController: Uses JWT for token-based authentication
- [x] Implement Models:
    - [x] User
    - [x] Message
    - [x] Conversation
    - [x] ExpertAssignment
    - [x] ExpertProfile
- [ ] Implement tests:
    - [ ] use the example test files provided in the starter package to test AuthController and ConversationsController
    - [ ] write additional tests following the same structure for other controllers to confirm that our code is working without needing to integrate with the frontend
    - [ ] test API directly using **Postman** for API testing, **curl** commands from the terminal, and **Rails console** for database testing
    - [ ] compare output for `project2backend.cs291.com`
- [ ] Record video walkthrough of frontend (project 2) and backend (project 3) applications working together demonstrating the following flows:
    - [ ] registration of a new user
    - [ ] login of the new user
    - [ ] as a question asker:
        - [ ] start a new conversation
        - [ ] show the new conversation appears in the conversation list
        - [ ] view their list of created conversations -- it should only inlude conversations initiated by the current user
        - [ ] post a message to a conversation
        - [ ] receive a new message for a conversation without refreshing the screen
    - [ ] as an expert:
        - [ ] modify expert profile
        - [ ] view the list of conversations initiated by other users
        - [ ] claim a conversation
        - [ ] respond with a new message to a claimed conversation
        - [ ] receive a new message for a conversation without refreshing the screen
        - [ ] unclaim a conversation 

## Suggested Implementation Strategy
- [ ] Create a Git repository
- [ ] Get the server running in the Docker environment
- [x] Add the User model
    - [x] add db migration
    - [x] creation of ActiveRecord model file
    - [x] add any tests for the User model
- [ ] Add the UsersController with a registration action
    - [ ] add the Users Controller file
    - [ ] add an action to the Users Controller file for registering a new user
    - [ ] add an entry to the `routes.rb` file for the new controller action
    - [ ] add tests of the user registration controller action
- [ ] ...
- [ ] Consider when we want to implement authentication/authorization (before or after implementing API functionality? pros and cons?)

## Implementation Notes
- Model implementation
    - Generate **Model** with `rails generate model` command
        - Auto-generates migration file in `db/migrate/`, model file in `app/models/`, and test file in `test/models/`
    - Modify **Migration** file in `db/migrate/`
        - Apply column constraints such as `null:false` and `default: `
        - Define relationships between databases by configuring **Foreign Keys** with `add_foreign_key` (there are other ways to do this too that Zach covered in class, but this is what I did)
        - Add indexes with `add_index` to (1) enforce uniqueness on **Unique Keys** with `unique: true` and (2) optimize future querying/filtering (requires some forethought -- what do you anticipate querying/filtering in your Controller logic?)
        - Run the migration with `rails db:migrate`
    - Set up the **Model** in the model file in `app/models/`
        - Define relationships between relationships by configuring **Associations** with `belongs_to` (references `foreign_key:`) and `has_one`/`has_many`. This corresponds to the lines connecting the tables in the provided er diagram.
        - Check that data meets requirements before being added to database by configuring **Validations** with `validates` (in particular, `presence: true` for non-nullable columns, `uniqueness:` for **Unique Keys**, and `inclusion: { in: %w[ ] }` for the status columns where only certain "enum" values are allowed).
        - Define any **Callbacks** and **Instance Methods** to run functions at certain points in the process.
    - Write and run Model tests in the test file in `test/models/`
        - Note: had to comment out the default **Fixtures** in `test/fixtures/` because they were unnecessary and causing errors.
    - Manual tests in **Console** with `rails console`
- **Controller** implementation
    - - Generate **Model** with `rails generate controller` command
        - Auto-generates controller file in `app/controllers/` and test file in `test/controllers/`
    - Set up the **Controller** in the controller file in `app/controllers/`
        - Define a method for each route according to the [API Specifications](/API_SPECIFICATION.md). It should interacting with your database model and providing a response via `render json:` with the appropriate `status:`. Can also define any helper functions needed.
        - Update `app/config/routes.rb` with the newly defined routes.
        - Write and run Controller tests in the test file in `test/controllers/`
        - Manual tests with `curl` commands
        - Note: one-time implementation of JWT token authentication in `app/controllers/application_controller.rb` using the provided `JwtService` function in `app/services/jwt_service.rb`
