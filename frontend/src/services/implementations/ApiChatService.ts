import type { ChatService } from '@/types';
import type {
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
  Message,
  SendMessageRequest,
  ExpertProfile,
  ExpertQueue,
  ExpertAssignment,
  UpdateExpertProfileRequest,
} from '@/types';
import TokenManager from '@/services/TokenManager';

interface ApiChatServiceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

/**
 * API implementation of ChatService for production use
 * Uses fetch for HTTP requests
 */
export class ApiChatService implements ChatService {
  private baseUrl: string;
  private tokenManager: TokenManager;

  constructor(config: ApiChatServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.tokenManager = TokenManager.getInstance();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // TODO: Implement the makeRequest helper method
    // This should:

    // 1. Construct the full URL using this.baseUrl and endpoint
    const url = `${this.baseUrl}${endpoint}`;

    // 2. Get the token using this.tokenManager.getToken()
    const token = this.tokenManager.getToken();

    // 3. Set up default headers including 'Content-Type': 'application/json'
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      // 4. Add Authorization header with Bearer token if token exists
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    // 4. Add Authorization header with Bearer token if token exists
    // if (token) {
    //   headers['Authorization'] = `Bearer ${token}`;
    // }
    
    try {
    // 5. Make the fetch request with the provided options
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

    // 6. Handle non-ok responses by throwing an error with status and message
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    
    // 7. Return the parsed JSON response
      return await response.json() as T;
    } catch (error) {
      console.error('Error making request: ', error);
      throw error;
    }

    // throw new Error('makeRequest method not implemented');
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    // TODO: Implement getConversations method
    // This should:

    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<Conversation[]> (
      '/conversations',
      {
        method: 'GET',
      },
    );

    // 2. Return the array of conversations
    return response;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('getConversations method not implemented');
  }

  async getConversation(_id: string): Promise<Conversation> {
    // TODO: Implement getConversation method
    // This should:

    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<Conversation> (
      `/conversations/${_id}`,
      {
        method: 'GET',
      },
    );

    // 2. Return the conversation object
    return response;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('getConversation method not implemented');
  }

  async createConversation(
    request: CreateConversationRequest
  ): Promise<Conversation> {
    // TODO: Implement createConversation method

    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<Conversation> (
      '/conversations',
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
    );

    // 2. Return the created conversation object
    return response;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('createConversation method not implemented');
  }

  async updateConversation(
    id: string,
    request: UpdateConversationRequest
  ): Promise<Conversation> {
    // SKIP, not currently used by application

    throw new Error('updateConversation method not implemented');
  }

  async deleteConversation(id: string): Promise<void> {
    // SKIP, not currently used by application

    throw new Error('deleteConversation method not implemented');
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    // TODO: Implement getMessages method

    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<Message[]> (
      `/conversations/${conversationId}/messages`,
      {
        method: 'GET',
      },
    );

    // 2. Return the array of messages
    return response;
    
    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('getMessages method not implemented');
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    // TODO: Implement sendMessage method
    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<Message> (
      '/messages',
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
    );

    // 2. Return the created message object
    return response;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('sendMessage method not implemented');
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    // SKIP, not currently used by application

    throw new Error('markMessageAsRead method not implemented');
  }

  // Expert-specific operations
  async getExpertQueue(): Promise<ExpertQueue> {
    // TODO: Implement getExpertQueue method
    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<ExpertQueue> (
      '/expert/queue',
      {
        method: 'GET',
      },
    );
    // 2. Return the expert queue object with waitingConversations and assignedConversations
    return response;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('getExpertQueue method not implemented');
  }

  async claimConversation(conversationId: string): Promise<void> {
    // TODO: Implement claimConversation method
    // This should:
    // 1. Make a request to the appropriate endpoint
    await this.makeRequest<{success: boolean}> (
      `/expert/conversations/${conversationId}/claim`,
      {
        method: 'POST',
      },
    );

    // 2. Return void (no response body expected)
    return;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('claimConversation method not implemented');
  }

  async unclaimConversation(conversationId: string): Promise<void> {
    // TODO: Implement unclaimConversation method
    // This should:
    // 1. Make a request to the appropriate endpoint
    await this.makeRequest<{success: boolean}> (
      `/expert/conversations/${conversationId}/unclaim`,
      {
        method: 'POST',
      },
    );

    // 2. Return void (no response body expected)
    return;
    
    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('unclaimConversation method not implemented');
  }

  async getExpertProfile(): Promise<ExpertProfile> {
    // TODO: Implement getExpertProfile method

    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<ExpertProfile> (
      '/expert/profile',
      {
        method: 'GET',
      },
    );
    
    // 2. Return the expert profile object
    return response;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('getExpertProfile method not implemented');
  }

  async updateExpertProfile(
    request: UpdateExpertProfileRequest
  ): Promise<ExpertProfile> {
    // TODO: Implement updateExpertProfile method
    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<ExpertProfile> (
      '/expert/profile',
      {
        method: 'PUT',
        body: JSON.stringify(request)
      },
    );

    // 2. Return the updated expert profile object
    return response;
    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('updateExpertProfile method not implemented');
  }

  async getExpertAssignmentHistory(): Promise<ExpertAssignment[]> {
    // TODO: Implement getExpertAssignmentHistory method
    // This should:
    // 1. Make a request to the appropriate endpoint
      const response = await this.makeRequest<ExpertAssignment[]> (
      '/expert/assignments/history',
      {
        method: 'GET',
      },
    );
    
    // 2. Return the array of expert assignments
    return response;
    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('getExpertAssignmentHistory method not implemented');
  }
}
