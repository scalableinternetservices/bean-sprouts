"""
Locust load test for chat-backend-rails application.

User personas:
1. IdleUser: Logs in and polls for updates every 5 seconds (weight: 10)
2. ActiveUser: Creates conversations, sends messages, and browses (weight: 3)
3. ExpertUser: Checks expert queue, claims conversations, responds (weight: 1)
"""

import random
import threading
from datetime import datetime
from locust import HttpUser, task, between


# Configuration
MAX_USERS = 10000

def auth_headers(token):
    """
    Helper function to generate authorization headers.
    
    Args:
        token (str): JWT authentication token
        
    Returns:
        dict: Headers dictionary with Authorization header
    """
    return {"Authorization": f"Bearer {token}"}


class UserNameGenerator:
    """
    Generates deterministic usernames to ensure reproducibility across test runs.
    Uses prime number multiplication to distribute usernames evenly.
    """
    PRIME_NUMBERS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]

    def __init__(self, max_users=MAX_USERS, seed=None, prime_number=None):
        self.seed = seed or random.randint(0, max_users)
        self.prime_number = prime_number or random.choice(self.PRIME_NUMBERS)
        self.current_index = -1
        self.max_users = max_users
    
    def generate_username(self):
        """Generate next username in sequence."""
        self.current_index += 1
        return f"user_{(self.seed + self.current_index * self.prime_number) % self.max_users}"


class UserStore:
    """
    Thread-safe storage for registered users and conversations.
    Allows active users to interact with existing users and conversations.
    """
    def __init__(self):
        self.used_usernames = {}
        self.conversation_ids = []
        self.username_lock = threading.Lock()
        self.conversation_lock = threading.Lock()

    def get_random_user(self):
        """Get a random existing user from the store."""
        with self.username_lock:
            if not self.used_usernames:
                return None
            random_username = random.choice(list(self.used_usernames.keys()))
            return self.used_usernames[random_username]

    def store_user(self, username, auth_token, user_id):
        """Store a newly registered/logged in user."""
        with self.username_lock:
            self.used_usernames[username] = {
                "username": username,
                "auth_token": auth_token,
                "user_id": user_id
            }
            return self.used_usernames[username]
    
    def has_users(self):
        """Check if any users exist in the store."""
        with self.username_lock:
            return len(self.used_usernames) > 0
    
    def add_conversation(self, conversation_id):
        """Add a conversation ID to the global store."""
        with self.conversation_lock:
            if conversation_id not in self.conversation_ids:
                self.conversation_ids.append(conversation_id)
    
    def get_random_conversation(self):
        """Get a random conversation ID from the store."""
        with self.conversation_lock:
            if not self.conversation_ids:
                return None
            return random.choice(self.conversation_ids)
    
    def has_conversations(self):
        """Check if any conversations exist in the store."""
        with self.conversation_lock:
            return len(self.conversation_ids) > 0


user_store = UserStore()
user_name_generator = UserNameGenerator(max_users=MAX_USERS)


class ChatBackend():
    """
    Base class for all user personas.
    Provides common authentication and API interaction methods.
    """        
    
    def login(self, username, password):
        """
        Login an existing user.
        
        Args:
            username (str): Username
            password (str): Password
            
        Returns:
            dict: User info with auth_token and user_id, or None if failed
        """
        response = self.client.post(
            "/auth/login",
            json={"username": username, "password": password},
            name="/auth/login"
        )
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("user", {})
            return user_store.store_user(
                username, 
                data.get("token"), 
                str(user_data.get("id"))
            )
        return None
        
    def register(self, username, password):
        """
        Register a new user.
        
        Args:
            username (str): Desired username
            password (str): Desired password
            
        Returns:
            dict: User info with auth_token and user_id, or None if failed
        """
        response = self.client.post(
            "/auth/register",
            json={"username": username, "password": password},
            name="/auth/register"
        )
        if response.status_code == 201 or response.status_code == 200:
            data = response.json()
            user_data = data.get("user", {})
            return user_store.store_user(
                username, 
                data.get("token"), 
                str(user_data.get("id"))
            )
        return None

    def check_conversation_updates(self, user):
        """
        Check for conversation updates since last check.
        
        Args:
            user (dict): User info with auth_token and user_id
            
        Returns:
            bool: True if request successful
        """
        params = {"userId": user.get("user_id")}
        if self.last_check_time:
            params["since"] = self.last_check_time.isoformat()
        
        response = self.client.get(
            "/api/conversations/updates",
            params=params,
            headers=auth_headers(user.get("auth_token")),
            name="/api/conversations/updates"
        )
        
        return response.status_code == 200
    
    def check_message_updates(self, user):
        """
        Check for message updates since last check.
        
        Args:
            user (dict): User info with auth_token and user_id
            
        Returns:
            bool: True if request successful
        """
        params = {"userId": user.get("user_id")}
        if self.last_check_time:
            params["since"] = self.last_check_time.isoformat()
        
        response = self.client.get(
            "/api/messages/updates",
            params=params,
            headers=auth_headers(user.get("auth_token")),
            name="/api/messages/updates"
        )
        
        return response.status_code == 200
    
    def check_expert_queue_updates(self, user):
        """
        Check for expert queue updates since last check.
        
        Args:
            user (dict): User info with auth_token and user_id
            
        Returns:
            bool: True if request successful
        """
        params = {"expertId": user.get("user_id")}
        if self.last_check_time:
            params["since"] = self.last_check_time.isoformat()
        
        response = self.client.get(
            "/api/expert-queue/updates",
            params=params,
            headers=auth_headers(user.get("auth_token")),
            name="/api/expert-queue/updates"
        )
        
        return response.status_code == 200


class IdleUser(HttpUser, ChatBackend):
    """
    Persona: A user that logs in and is idle but their browser polls for updates.
    Checks for message updates, conversation updates, and expert queue updates every 5 seconds.
    
    This simulates users with the application open in their browser but not actively
    interacting - the most common type of user in a real-world scenario.
    
    Weight: 10 (most common user type - represents passive users with browsers open)
    """
    weight = 10
    wait_time = between(5, 5)  # Check every 5 seconds

    def on_start(self):
        """Called when a simulated user starts."""
        self.last_check_time = None
        username = user_name_generator.generate_username()
        password = username
        # Try to register first, if it fails (user exists), then login
        self.user =  self.register(username, password) or self.login(username, password)
        if not self.user:
            raise Exception(f"Failed to login or register user {username}")

    @task
    def poll_for_updates(self):
        """Poll for all types of updates (simulates browser polling)."""
        # Check conversation updates
        self.check_conversation_updates(self.user)
        
        # Check message updates
        self.check_message_updates(self.user)
        
        # Check expert queue updates
        self.check_expert_queue_updates(self.user)
        
        # Update last check time
        self.last_check_time = datetime.utcnow()


class ActiveUser(HttpUser, ChatBackend):
    """
    Persona: An active user who creates conversations, sends messages, and browses.
    Represents students or users actively using the help desk system to ask questions
    and engage in conversations.
    
    Weight: 3 (less common than idle users, but generates more load per user)
    """
    weight = 3
    wait_time = between(10, 30)  # Wait 10-30 seconds between actions

    def on_start(self):
        """Called when a simulated user starts."""
        self.last_check_time = None
        self.my_conversation_ids = []
        username = user_name_generator.generate_username()
        password = username
        # Try to register first, if it fails (user exists), then login
        self.user = self.register(username, password) or self.login(username, password)
        if not self.user:
            raise Exception(f"Failed to login or register user {username}")

    @task(2)
    def create_conversation(self):
        """
        Create a new conversation (help request).
        Weight: 2 (common action)
        """
        response = self.client.post(
            "/conversations",
            json={
                "title": f"Question about {random.choice(['Rails', 'Ruby', 'AWS', 'Docker', 'Database'])} - {datetime.utcnow().isoformat()}"
            },
            headers=auth_headers(self.user.get("auth_token")),
            name="/conversations [create]"
        )
        
        if response.status_code == 201:
            data = response.json()
            conversation_id = str(data.get("id"))
            if conversation_id:
                self.my_conversation_ids.append(conversation_id)
                user_store.add_conversation(conversation_id)

    @task(4)
    def send_message(self):
        """
        Send a message to an existing conversation.
        Weight: 5 (most common action for active users)
        """
        if not self.my_conversation_ids:
            return
        
        conversation_id = random.choice(self.my_conversation_ids)
        response = self.client.post(
            "/messages",
            json={
                "conversationId": conversation_id,
                "content": f"Message at {datetime.utcnow().isoformat()}"
            },
            headers=auth_headers(self.user.get("auth_token")),
            name="/messages [create]"
        )

    @task(3)
    def list_conversations(self):
        """
        List all conversations for the user.
        Weight: 2 (browsing action)
        """
        response = self.client.get(
            "/conversations",
            headers=auth_headers(self.user.get("auth_token")),
            name="/conversations [list]"
        )
        
        # Update local conversation list from response
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                for conv in data:
                    conv_id = str(conv.get("id"))
                    if conv_id and conv_id not in self.my_conversation_ids:
                        self.my_conversation_ids.append(conv_id)

    @task(3)
    def get_conversation_messages(self):
        """
        Get messages for a specific conversation.
        Weight: 3 (common browsing action)
        """
        if not self.my_conversation_ids:
            return
        
        conversation_id = random.choice(self.my_conversation_ids)
        response = self.client.get(
            f"/conversations/{conversation_id}/messages",
            headers=auth_headers(self.user.get("auth_token")),
            name="/conversations/:id/messages [list]"
        )

    @task(1)
    def mark_message_as_read(self):
        """
        Mark a message as read.
        Weight: 1 (occasional action)
        """
        if not self.my_conversation_ids:
            return
        
        conversation_id = random.choice(self.my_conversation_ids)
        
        # First get messages
        response = self.client.get(
            f"/conversations/{conversation_id}/messages",
            headers=auth_headers(self.user.get("auth_token")),
            name="/conversations/:id/messages [list]"
        )
        
        if response.status_code == 200:
            messages = response.json()
            if isinstance(messages, list) and messages:
                # Find an unread message from someone else
                for msg in messages:
                    if not msg.get("isRead") and str(msg.get("senderId")) != self.user.get("user_id"):
                        message_id = str(msg.get("id"))
                        self.client.put(
                            f"/messages/{message_id}/read",
                            headers=auth_headers(self.user.get("auth_token")),
                            name="/messages/:id/read"
                        )
                        break

    @task(1)
    def get_current_user(self):
        """
        Get current user information.
        Weight: 1 (occasional check)
        """
        response = self.client.get(
            "/auth/me",
            headers=auth_headers(self.user.get("auth_token")),
            name="/auth/me"
        )


class ExpertUser(HttpUser, ChatBackend):
    """
    Persona: An expert user who checks the expert queue and responds to help requests.
    Represents support staff, TAs, or experts in the help desk system who answer questions.
    
    Weight: 1 (least common, but important for system functionality)
    """
    weight = 1
    wait_time = between(15, 45)  # Experts check less frequently

    def on_start(self):
        """Called when a simulated user starts."""
        self.last_check_time = None
        self.claimed_conversations = []
        username = user_name_generator.generate_username()
        password = username
        # Try to register first, if it fails (user exists), then login
        self.user = self.register(username, password) or self.login(username, password)
        if not self.user:
            raise Exception(f"Failed to login or register user {username}")

    @task(4)
    def check_expert_queue(self):
        """
        Check the expert queue for new help requests.
        Weight: 4 (primary action for experts)
        """
        response = self.client.get(
            "/expert/queue",
            headers=auth_headers(self.user.get("auth_token")),
            name="/expert/queue"
        )
        
        # Store conversation IDs for later claiming
        if response.status_code == 200:
            data = response.json()
            waiting = data.get("waitingConversations", [])
            for conv in waiting:
                conv_id = str(conv.get("id"))
                if conv_id:
                    user_store.add_conversation(conv_id)

    @task(3)
    def claim_help_request(self):
        """
        Claim a help request from the queue.
        Weight: 3 (common action for active experts)
        """
        # First get the queue
        response = self.client.get(
            "/expert/queue",
            headers=auth_headers(self.user.get("auth_token")),
            name="/expert/queue"
        )
        
        if response.status_code == 200:
            data = response.json()
            waiting = data.get("waitingConversations", [])
            if waiting:
                conversation_id = str(waiting[0].get("id"))
                claim_response = self.client.post(
                    f"/expert/conversations/{conversation_id}/claim",
                    headers=auth_headers(self.user.get("auth_token")),
                    name="/expert/conversations/:id/claim"
                )
                
                if claim_response.status_code == 200:
                    self.claimed_conversations.append(conversation_id)

    @task(4)
    def respond_to_conversation(self):
        """
        Send a response message to a claimed conversation.
        Weight: 4 (primary expert activity)
        """
        if not self.claimed_conversations:
            return
        
        conversation_id = random.choice(self.claimed_conversations)
        response = self.client.post(
            "/messages",
            json={
                "conversationId": conversation_id,
                "content": f"Expert response: {random.choice(['Let me help you with that.', 'Here is the solution...', 'Try this approach...', 'Have you considered...'])} [{datetime.utcnow().isoformat()}]"
            },
            headers=auth_headers(self.user.get("auth_token")),
            name="/messages [create]"
        )

    @task(2)
    def view_claimed_conversations(self):
        """
        View messages in claimed conversations.
        Weight: 2 (browsing claimed conversations)
        """
        if not self.claimed_conversations:
            return
        
        conversation_id = random.choice(self.claimed_conversations)
        response = self.client.get(
            f"/conversations/{conversation_id}/messages",
            headers=auth_headers(self.user.get("auth_token")),
            name="/conversations/:id/messages [list]"
        )

    @task(1)
    def unclaim_conversation(self):
        """
        Unclaim a conversation (return it to the queue).
        Weight: 1 (rare action)
        """
        if not self.claimed_conversations:
            return
        
        conversation_id = random.choice(self.claimed_conversations)
        response = self.client.post(
            f"/expert/conversations/{conversation_id}/unclaim",
            headers=auth_headers(self.user.get("auth_token")),
            name="/expert/conversations/:id/unclaim"
        )
        
        if response.status_code == 200:
            self.claimed_conversations.remove(conversation_id)

    @task(1)
    def check_for_updates(self):
        """
        Poll for expert queue updates.
        Weight: 1 (occasional polling)
        """
        self.check_expert_queue_updates(self.user)
        self.last_check_time = datetime.utcnow()

    @task(1)
    def view_expert_profile(self):
        """
        View expert profile.
        Weight: 1 (occasional check)
        """
        response = self.client.get(
            "/expert/profile",
            headers=auth_headers(self.user.get("auth_token")),
            name="/expert/profile"
        )

    @task(1)
    def view_assignment_history(self):
        """
        View expert assignment history.
        Weight: 1 (occasional check)
        """
        response = self.client.get(
            "/expert/assignments/history",
            headers=auth_headers(self.user.get("auth_token")),
            name="/expert/assignments/history"
        )