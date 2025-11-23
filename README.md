# f25_cmpsc291a_project3
Our implementation of UCSB Fall 2025 CMPSC 291A "Scalable Internet Services" Project 3 (Rails Backend with Docker)

## Start Rails backend server
- Ensure Docker Desktop is running
- Start Docker container: `docker-compose up -d`
- Start Rails bash shell: `docker-compose exec web bash`
- Navigate to [/help_desk_backend](/help_desk_backend/) directory: `cd help_desk_backend`
- First time:
    - Install dependencies: `bundle install`
    - Create database: `rails db:create`
    - Run database migrations: `rails db:migrate`
- Start server: From [/help_desk_backend](/help_desk_backend/), `rails server -b 0.0.0.0 -p 3000`
- Access backend: [http://localhost:3000](http://localhost:3000)

## Start React/Typescript frontend
- Navigate to your [Project 2 (Chat Frontend)](https://github.com/laszlo-tw/f25_cmpsc291a_project2) directory
- Start frontend: `npm run dev`
- Access frontend: hosted on [http://localhost:5173](http://localhost:5173)
- Connect to [Project 3](https://github.com/laszlo-tw/f25_cmpsc291a_project3) backend:
    - Go to: [http://localhost:5173/settings](http://localhost:5173/settings)
    - Change Backend Mode to "API (Real Backend)"
    - Set API Base URL to [http://localhost:3000](http://localhost:3000)
    - Save configuration
 
## Testing
- See [TESTS.md](/TESTS.md)

## Reset the Database
```
rails db:reset
```
or, equivalently:
```
rails db:drop
rails db:setup
```
 
## Cleanup
- Stop the Docker container: `docker-compose down`
