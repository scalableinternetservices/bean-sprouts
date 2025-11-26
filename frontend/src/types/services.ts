import type { User } from './user';
import type {
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
} from './conversation';
import type { Message, SendMessageRequest } from './message';
import type {
  ExpertProfile,
  ExpertQueue,
  ExpertAssignment,
  UpdateExpertProfileRequest,
} from './expert';
import type { ConnectionStatus } from './errors';

// Authentication Service Interface
export interface AuthService {
  login(username: string, password: string): Promise<User>;
  register(userData: RegisterRequest): Promise<User>;
  logout(): Promise<void>;
  refreshToken(): Promise<User>;
  getCurrentUser(): Promise<User | null>;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

// Chat Service Interface
export interface ChatService {
  // Conversations
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation>;
  createConversation(request: CreateConversationRequest): Promise<Conversation>;
  updateConversation(
    id: string,
    request: UpdateConversationRequest
  ): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;

  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(request: SendMessageRequest): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;

  // Expert-specific operations
  getExpertQueue(): Promise<ExpertQueue>;
  claimConversation(conversationId: string): Promise<void>;
  unclaimConversation(conversationId: string): Promise<void>;
  getExpertProfile(): Promise<ExpertProfile>;
  updateExpertProfile(
    request: UpdateExpertProfileRequest
  ): Promise<ExpertProfile>;
  getExpertAssignmentHistory(): Promise<ExpertAssignment[]>; // Returns only conversations no longer assigned to the expert
}

// Update Service Interface
export interface UpdateService {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;

  // Event handlers
  onConversationUpdate(callback: (conversation: Conversation) => void): void;
  onMessageUpdate(callback: (message: Message) => void): void;
  onExpertQueueUpdate(callback: (queue: ExpertQueue) => void): void;
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void;

  // Remove event handlers
  offConversationUpdate(callback: (conversation: Conversation) => void): void;
  offMessageUpdate(callback: (message: Message) => void): void;
  offExpertQueueUpdate(callback: (queue: ExpertQueue) => void): void;
  offConnectionStatusChange(callback: (status: ConnectionStatus) => void): void;
}

// ConnectionStatus is now defined in ./errors.ts

// TODO: Should we move these to the factories?
// Service Factory Interfaces
export interface AuthServiceFactory {
  createService(): AuthService;
}

export interface ChatServiceFactory {
  createService(): ChatService;
}

export interface UpdateServiceFactory {
  createService(): UpdateService;
}

// Configuration types are now defined in ./config.ts
