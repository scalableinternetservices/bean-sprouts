import type { AuthService, ChatService } from '@/types';
import { DummyAuthService } from './DummyAuthService';
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

/**
 * Dummy implementation of ChatService for development and testing
 * Uses localStorage for persistence and realistic delays
 */
export class DummyChatService implements ChatService {
  private storageKey = 'dummy-chat-data';
  private delay = 300; // Base delay in ms
  private authService: AuthService = new DummyAuthService();

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      const initialData = this.getInitialData();
      localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }
  }

  private getInitialData() {
    return {
      conversations: [
        {
          id: '1',
          title: 'How to optimize SQL queries?',
          status: 'active' as const,
          questionerId: 'alice',
          questionerUsername: 'alice',
          assignedExpertId: 'bob',
          assignedExpertUsername: 'bob',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          lastMessageAt: '2024-01-15T10:30:00Z',
          unreadCount: 0,
        },
        {
          id: '2',
          title: 'React component re-rendering issues',
          status: 'waiting' as const,
          questionerId: 'bob',
          questionerUsername: 'bob',
          assignedExpertId: null,
          assignedExpertUsername: null,
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
          lastMessageAt: '2024-01-15T11:00:00Z',
          unreadCount: 1,
        },
        {
          id: '3',
          title: 'Database connection pooling',
          status: 'active' as const,
          questionerId: 'charlie',
          questionerUsername: 'charlie',
          assignedExpertId: 'alice',
          assignedExpertUsername: 'alice',
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:15:00Z',
          lastMessageAt: '2024-01-15T12:15:00Z',
          unreadCount: 0,
        },
      ],
      messages: {
        '1': [
          {
            id: 'msg1',
            conversationId: '1',
            senderId: 'alice',
            senderRole: 'initiator' as const,
            senderUsername: 'alice',
            content:
              "I have a complex SQL query that's running very slowly. How can I optimize it?",
            timestamp: '2024-01-15T10:00:00Z',
            isRead: true,
          },
          {
            id: 'msg2',
            conversationId: '1',
            senderId: 'bob',
            senderRole: 'expert' as const,
            senderUsername: 'bob',
            content:
              "I'd be happy to help you optimize your SQL query! Could you share the query and explain what it's trying to accomplish?",
            timestamp: '2024-01-15T10:15:00Z',
            isRead: true,
          },
          {
            id: 'msg3',
            conversationId: '1',
            senderId: 'alice',
            senderRole: 'initiator' as const,
            senderUsername: 'alice',
            content:
              'Here is the query: SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.created_at > "2024-01-01" AND o.status = "completed"',
            timestamp: '2024-01-15T10:30:00Z',
            isRead: true,
          },
        ],
        '2': [
          {
            id: 'msg4',
            conversationId: '2',
            senderId: 'bob',
            senderRole: 'initiator' as const,
            senderUsername: 'bob',
            content:
              'My React components are re-rendering too often. What could be causing this?',
            timestamp: '2024-01-15T11:00:00Z',
            isRead: false,
          },
        ],
        '3': [
          {
            id: 'msg5',
            conversationId: '3',
            senderId: 'charlie',
            senderRole: 'initiator' as const,
            senderUsername: 'charlie',
            content:
              'I need help setting up database connection pooling for my Node.js application.',
            timestamp: '2024-01-15T12:00:00Z',
            isRead: true,
          },
          {
            id: 'msg6',
            conversationId: '3',
            senderId: 'alice',
            senderRole: 'expert' as const,
            senderUsername: 'alice',
            content:
              'Connection pooling is crucial for performance! What database are you using?',
            timestamp: '2024-01-15T12:15:00Z',
            isRead: true,
          },
        ],
      },
      expertProfile: {
        id: 'alice',
        userId: 'alice',
        bio: 'Experienced software engineer with expertise in SQL optimization, React development, and system architecture. I love helping developers solve complex technical challenges.',
        knowledgeBaseLinks: [
          'https://dev.mysql.com/doc/refman/8.0/en/optimization.html',
          'https://react.dev/learn/render-and-commit',
          'https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/',
        ],
      },
      expertQueue: {
        waitingConversations: [
          {
            id: '2',
            title: 'React component re-rendering issues',
            status: 'waiting' as const,
            questionerId: 'bob',
            questionerUsername: 'bob',
            assignedExpertId: null,
            assignedExpertUsername: null,
            createdAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-01-15T11:00:00Z',
            lastMessageAt: '2024-01-15T11:00:00Z',
            unreadCount: 1,
          },
        ],
        assignedConversations: [
          {
            id: '1',
            title: 'How to optimize SQL queries?',
            status: 'active' as const,
            questionerId: 'alice',
            questionerUsername: 'alice',
            assignedExpertId: 'bob',
            assignedExpertUsername: 'bob',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            lastMessageAt: '2024-01-15T10:30:00Z',
            unreadCount: 0,
          },
          {
            id: '3',
            title: 'Database connection pooling',
            status: 'active' as const,
            questionerId: 'charlie',
            questionerUsername: 'charlie',
            assignedExpertId: 'alice',
            assignedExpertUsername: 'alice',
            createdAt: '2024-01-15T12:00:00Z',
            updatedAt: '2024-01-15T12:15:00Z',
            lastMessageAt: '2024-01-15T12:15:00Z',
            unreadCount: 0,
          },
        ],
      },
      expertAssignments: [
        {
          id: 'assignment1',
          conversationId: '4',
          expertId: 'alice',
          assignedAt: '2024-01-14T15:00:00Z',
          resolvedAt: '2024-01-14T16:30:00Z',
          status: 'resolved' as const,
        },
      ],
    };
  }

  private async delayResponse<T>(data: T): Promise<T> {
    await new Promise(resolve =>
      setTimeout(resolve, this.delay + Math.random() * 200)
    );
    return data;
  }

  private getStorageData(): {
    conversations: Conversation[];
    messages: { [conversationId: string]: Message[] };
    expertProfile: ExpertProfile;
    expertQueue: ExpertQueue;
    expertAssignments: ExpertAssignment[];
  } {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : this.getInitialData();
  }

  private setStorageData(data: {
    conversations: Conversation[];
    messages: { [conversationId: string]: Message[] };
    expertProfile: ExpertProfile;
    expertQueue: ExpertQueue;
    expertAssignments: ExpertAssignment[];
  }): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const data = this.getStorageData();
    const currentUser = await this.authService.getCurrentUser();
    data.conversations = data.conversations.filter(
      (c: Conversation) => c.questionerId === currentUser!.id
    );
    return this.delayResponse(data.conversations);
  }

  async getConversation(id: string): Promise<Conversation> {
    const data = this.getStorageData();
    const conversation = data.conversations.find(
      (c: Conversation) => c.id === id
    );
    if (!conversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    return this.delayResponse(conversation);
  }

  async createConversation(
    request: CreateConversationRequest
  ): Promise<Conversation> {
    const data = this.getStorageData();
    const currentUser = await this.authService.getCurrentUser();
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: request.title,
      status: 'waiting',
      questionerId: currentUser!.id,
      questionerUsername: currentUser!.username,
      assignedExpertId: null,
      assignedExpertUsername: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };

    data.conversations.push(newConversation);
    this.setStorageData(data);
    return this.delayResponse(newConversation);
  }

  async updateConversation(
    id: string,
    request: UpdateConversationRequest
  ): Promise<Conversation> {
    const data = this.getStorageData();
    const conversationIndex = data.conversations.findIndex(
      (c: Conversation) => c.id === id
    );
    if (conversationIndex === -1) {
      throw new Error(`Conversation with id ${id} not found`);
    }

    const updatedConversation = {
      ...data.conversations[conversationIndex],
      ...request,
      updatedAt: new Date().toISOString(),
    };

    data.conversations[conversationIndex] = updatedConversation;
    this.setStorageData(data);
    return this.delayResponse(updatedConversation);
  }

  async deleteConversation(id: string): Promise<void> {
    const data = this.getStorageData();
    data.conversations = data.conversations.filter(
      (c: Conversation) => c.id !== id
    );
    delete data.messages[id];
    this.setStorageData(data);
    await this.delayResponse(undefined);
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    const data = this.getStorageData();
    const messages = data.messages[conversationId] || [];
    return this.delayResponse(messages);
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    const currentConversation = await this.getConversation(
      request.conversationId
    );
    // TODO: Get current user from service container or method parameter
    const currentUser = await this.authService.getCurrentUser();

    const data = this.getStorageData();
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId: request.conversationId,
      senderId: currentUser!.id,
      senderRole:
        currentConversation.questionerId === currentUser!.id
          ? 'initiator'
          : 'expert',
      senderUsername: currentUser!.username,
      content: request.content,
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    if (!data.messages[request.conversationId]) {
      data.messages[request.conversationId] = [];
    }
    data.messages[request.conversationId].push(newMessage);

    // Update conversation last message time
    const conversationIndex = data.conversations.findIndex(
      (c: Conversation) => c.id === request.conversationId
    );
    if (conversationIndex !== -1) {
      data.conversations[conversationIndex].lastMessageAt =
        newMessage.timestamp;
      data.conversations[conversationIndex].updatedAt = newMessage.timestamp;
    }

    this.setStorageData(data);
    return this.delayResponse(newMessage);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const data = this.getStorageData();
    for (const conversationId in data.messages) {
      const messageIndex = data.messages[conversationId].findIndex(
        (m: Message) => m.id === messageId
      );
      if (messageIndex !== -1) {
        data.messages[conversationId][messageIndex].isRead = true;
        break;
      }
    }
    this.setStorageData(data);
    await this.delayResponse(undefined);
  }

  // Expert-specific operations
  async getExpertQueue(): Promise<ExpertQueue> {
    const data = this.getStorageData();
    const currentUser = await this.authService.getCurrentUser();
    data.expertQueue.waitingConversations =
      data.expertQueue.waitingConversations.filter(
        (c: Conversation) => c.assignedExpertId === null
      );
    data.expertQueue.assignedConversations =
      data.expertQueue.assignedConversations.filter(
        (c: Conversation) => c.assignedExpertId === currentUser!.id
      );
    return this.delayResponse(data.expertQueue);
  }

  async claimConversation(conversationId: string): Promise<void> {
    const data = this.getStorageData();
    const conversationIndex = data.conversations.findIndex(
      (c: Conversation) => c.id === conversationId
    );
    if (conversationIndex === -1) {
      throw new Error(`Conversation with id ${conversationId} not found`);
    }

    // Get current user from service container or method parameter
    const currentUser = await this.authService.getCurrentUser();

    // Update conversation
    data.conversations[conversationIndex].assignedExpertId = currentUser!.id;
    data.conversations[conversationIndex].assignedExpertUsername =
      currentUser!.username;
    data.conversations[conversationIndex].status = 'active';
    data.conversations[conversationIndex].updatedAt = new Date().toISOString();

    // Update expert queue
    const conversation = data.conversations[conversationIndex];
    data.expertQueue.waitingConversations =
      data.expertQueue.waitingConversations.filter(
        (conv: Conversation) => conv.id !== conversationId
      );
    data.expertQueue.assignedConversations.push(conversation);

    this.setStorageData(data);
    await this.delayResponse(undefined);
  }

  async unclaimConversation(conversationId: string): Promise<void> {
    const data = this.getStorageData();
    const conversationIndex = data.conversations.findIndex(
      (c: Conversation) => c.id === conversationId
    );
    if (conversationIndex === -1) {
      throw new Error(`Conversation with id ${conversationId} not found`);
    }

    // Update conversation
    data.conversations[conversationIndex].assignedExpertId = null;
    data.conversations[conversationIndex].assignedExpertUsername = null;
    data.conversations[conversationIndex].status = 'waiting';
    data.conversations[conversationIndex].updatedAt = new Date().toISOString();

    // Update expert queue
    const conversation = data.conversations[conversationIndex];
    data.expertQueue.assignedConversations =
      data.expertQueue.assignedConversations.filter(
        (conv: Conversation) => conv.id !== conversationId
      );
    data.expertQueue.waitingConversations.push(conversation);

    this.setStorageData(data);
    await this.delayResponse(undefined);
  }

  async getExpertProfile(): Promise<ExpertProfile> {
    const data = this.getStorageData();
    return this.delayResponse(data.expertProfile);
  }

  async updateExpertProfile(
    request: UpdateExpertProfileRequest
  ): Promise<ExpertProfile> {
    const data = this.getStorageData();
    const updatedProfile = {
      ...data.expertProfile,
      ...request,
    };
    data.expertProfile = updatedProfile;
    this.setStorageData(data);
    return this.delayResponse(updatedProfile);
  }

  async getExpertAssignmentHistory(): Promise<ExpertAssignment[]> {
    const data = this.getStorageData();
    return this.delayResponse(data.expertAssignments);
  }
}
