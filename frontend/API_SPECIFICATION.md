# Chat Application API Specification

This document describes the REST API endpoints available in the Rails backend for the chat application.

## Base URL
```
http://localhost:3001
```

## Authentication
The API uses session-based authentication with JWT tokens. All authenticated endpoints require:
- A valid session cookie
- OR a Bearer token in the Authorization header

## Response Format
All responses are in JSON format. Error responses include an `error` or `errors` field with details.

## Endpoints

### Health Check

#### GET /health
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "created_at": "2024-01-15T10:30:00Z",
    "last_active_at": "2024-01-15T10:30:00Z"
  },
  "token": "jwt_token_string"
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": ["Username has already been taken", "Password is too short"]
}
```

#### POST /auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "created_at": "2024-01-15T10:30:00Z",
    "last_active_at": "2024-01-15T10:30:00Z"
  },
  "token": "jwt_token_string"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid username or password"
}
```

#### POST /auth/logout
Logout the current user.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

#### POST /auth/refresh
Refresh the JWT token using the session cookie.

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "created_at": "2024-01-15T10:30:00Z",
    "last_active_at": "2024-01-15T10:30:00Z"
  },
  "token": "new_jwt_token_string"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "No session found"
}
```

#### GET /auth/me
Get current user information.

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "created_at": "2024-01-15T10:30:00Z",
  "last_active_at": "2024-01-15T10:30:00Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "No session found"
}
```

### Conversations

#### GET /conversations
Get all conversations for the current user (as initiator or assigned expert).

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "title": "How to deploy Rails app?",
    "status": "active",
    "questionerId": "1",
    "questionerUsername": "john_doe",
    "assignedExpertId": "2",
    "assignedExpertUsername": "expert_jane",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z",
    "lastMessageAt": "2024-01-15T11:45:00Z",
    "unreadCount": 2
  }
]
```

#### GET /conversations/:id
Get a specific conversation by ID.

**Response (200 OK):**
```json
{
  "id": "1",
  "title": "How to deploy Rails app?",
  "status": "active",
  "questionerId": "1",
  "questionerUsername": "john_doe",
  "assignedExpertId": "2",
  "assignedExpertUsername": "expert_jane",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z",
  "lastMessageAt": "2024-01-15T11:45:00Z",
  "unreadCount": 2
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Conversation not found"
}
```

#### POST /conversations
Create a new conversation.

**Request Body:**
```json
{
  "title": "string"
}
```

**Response (201 Created):**
```json
{
  "id": "1",
  "title": "How to deploy Rails app?",
  "status": "waiting",
  "questionerId": "1",
  "questionerUsername": "john_doe",
  "assignedExpertId": null,
  "assignedExpertUsername": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "lastMessageAt": null,
  "unreadCount": 0
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": ["Title can't be blank"]
}
```

### Messages

#### GET /conversations/:conversation_id/messages
Get all messages for a conversation.

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "conversationId": "1",
    "senderId": "1",
    "senderUsername": "john_doe",
    "senderRole": "initiator",
    "content": "How do I deploy a Rails application?",
    "timestamp": "2024-01-15T10:30:00Z",
    "isRead": true
  },
  {
    "id": "2",
    "conversationId": "1",
    "senderId": "2",
    "senderUsername": "expert_jane",
    "senderRole": "expert",
    "content": "You can use Heroku, AWS, or DigitalOcean...",
    "timestamp": "2024-01-15T10:35:00Z",
    "isRead": false
  }
]
```

#### POST /messages
Send a new message.

**Request Body:**
```json
{
  "conversationId": "1",
  "content": "string"
}
```

**Response (201 Created):**
```json
{
  "id": "3",
  "conversationId": "1",
  "senderId": "1",
  "senderUsername": "john_doe",
  "senderRole": "initiator",
  "content": "Thank you for the help!",
  "timestamp": "2024-01-15T10:40:00Z",
  "isRead": false
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Conversation not found"
}
```

#### PUT /messages/:id/read
Mark a message as read.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Cannot mark your own messages as read"
}
```

### Expert Operations

#### GET /expert/queue
Get the expert queue (waiting and assigned conversations).

**Response (200 OK):**
```json
{
  "waitingConversations": [
    {
      "id": "1",
      "title": "How to deploy Rails app?",
      "status": "waiting",
      "questionerId": "1",
      "questionerUsername": "john_doe",
      "assignedExpertId": null,
      "assignedExpertUsername": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "lastMessageAt": "2024-01-15T10:30:00Z",
      "unreadCount": 1
    }
  ],
  "assignedConversations": [
    {
      "id": "2",
      "title": "Database optimization help",
      "status": "active",
      "questionerId": "3",
      "questionerUsername": "student_bob",
      "assignedExpertId": "2",
      "assignedExpertUsername": "expert_jane",
      "createdAt": "2024-01-15T09:15:00Z",
      "updatedAt": "2024-01-15T11:20:00Z",
      "lastMessageAt": "2024-01-15T11:20:00Z",
      "unreadCount": 0
    }
  ]
}
```

#### POST /expert/conversations/:conversation_id/claim
Claim a conversation as an expert.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "error": "Conversation is already assigned to an expert"
}
```

#### POST /expert/conversations/:conversation_id/unclaim
Unclaim a conversation (return it to the waiting queue).

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "You are not assigned to this conversation"
}
```

#### GET /expert/profile
Get the current expert's profile.

**Response (200 OK):**
```json
{
  "id": "1",
  "userId": "2",
  "bio": "Experienced Rails developer with 5+ years experience",
  "knowledgeBaseLinks": [
    "https://guides.rubyonrails.org/",
    "https://stackoverflow.com/questions/tagged/ruby-on-rails"
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### PUT /expert/profile
Update the expert's profile.

**Request Body:**
```json
{
  "bio": "string",
  "knowledgeBaseLinks": ["string"]
}
```

**Response (200 OK):**
```json
{
  "id": "1",
  "userId": "2",
  "bio": "Updated bio text",
  "knowledgeBaseLinks": [
    "https://guides.rubyonrails.org/",
    "https://stackoverflow.com/questions/tagged/ruby-on-rails"
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

#### GET /expert/assignments/history
Get the expert's assignment history.

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "conversationId": "1",
    "expertId": "2",
    "status": "resolved",
    "assignedAt": "2024-01-15T10:30:00Z",
    "resolvedAt": "2024-01-15T11:45:00Z",
    "rating": 5
  }
]
```

### Update/Polling Endpoints

#### GET /api/conversations/updates
Get conversation updates since a specific timestamp.

**Query Parameters:**
- `userId` (required): The user ID
- `since` (optional): ISO 8601 timestamp to get updates since

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "title": "How to deploy Rails app?",
    "status": "active",
    "questionerId": "1",
    "questionerUsername": "john_doe",
    "assignedExpertId": "2",
    "assignedExpertUsername": "expert_jane",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z",
    "lastMessageAt": "2024-01-15T11:45:00Z",
    "unreadCount": 2
  }
]
```

#### GET /api/messages/updates
Get message updates since a specific timestamp.

**Query Parameters:**
- `userId` (required): The user ID
- `since` (optional): ISO 8601 timestamp to get updates since

**Response (200 OK):**
```json
[
  {
    "id": "3",
    "conversationId": "1",
    "senderId": "2",
    "senderUsername": "expert_jane",
    "senderRole": "expert",
    "content": "Here's how you can deploy your Rails app...",
    "timestamp": "2024-01-15T11:45:00Z",
    "isRead": false
  }
]
```

#### GET /api/expert-queue/updates
Get expert queue updates since a specific timestamp.

**Query Parameters:**
- `expertId` (required): The expert ID
- `since` (optional): ISO 8601 timestamp to get updates since

**Response (200 OK):**
```json
[
  {
    "waitingConversations": [
      {
        "id": "1",
        "title": "How to deploy Rails app?",
        "status": "waiting",
        "questionerId": "1",
        "questionerUsername": "john_doe",
        "assignedExpertId": null,
        "assignedExpertUsername": null,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "lastMessageAt": "2024-01-15T10:30:00Z",
        "unreadCount": 1
      }
    ],
    "assignedConversations": []
  }
]
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

## Notes

1. All timestamps are in ISO 8601 format
2. User IDs and conversation IDs are returned as strings
3. The API uses session cookies for authentication, but also supports JWT tokens
4. Expert endpoints require the user to have an expert profile
5. Messages can only be marked as read by users who didn't send them
6. Conversations are automatically assigned a "waiting" status when created
7. Expert profiles are automatically created when users register
