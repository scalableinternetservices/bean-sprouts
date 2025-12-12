import type {
  UpdateService,
  Conversation,
  Message,
  ExpertQueue,
  ConnectionStatus,
} from '@/types';
import TokenManager from '@/services/TokenManager';

interface SSEUpdateServiceConfig {
  baseUrl: string;
}

/**
 * Server-Sent Events implementation of UpdateService
 * This will be fully implemented in a future step
 */
export class SSEUpdateService implements UpdateService {
  private config: SSEUpdateServiceConfig;
  private isRunningFlag: boolean = false;
  private eventSource: EventSource | null = null;
  private tokenManager: TokenManager;
  private conversationCallbacks: Set<(conversation: Conversation) => void> =
    new Set();
  private messageCallbacks: Set<(message: Message) => void> = new Set();
  private expertQueueCallbacks: Set<(queue: ExpertQueue) => void> = new Set();
  private connectionStatusCallbacks: Set<(status: ConnectionStatus) => void> =
    new Set();

  constructor(config: SSEUpdateServiceConfig) {
    this.config = config;
    this.tokenManager = TokenManager.getInstance();
  }

  async start(): Promise<void> {
    if (this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = true;

    const token = this.tokenManager.getToken();
    if (!token) {
      console.error('SSEUpdateService: No auth token available');
      this.notifyConnectionStatusChange({
        connected: false,
        error: 'No authentication token'
      });
      return;
    }

    const url = `${this.config.baseUrl}/api/updates/stream?token=${encodeURIComponent(token)}`;

    try {
      this.eventSource = new EventSource(url, {
        withCredentials: true
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('SSEUpdateService: Failed to create connection:', error);
      this.notifyConnectionStatusChange({
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = false;
    this.notifyConnectionStatusChange({ connected: false });

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  // Event handlers
  onConversationUpdate(callback: (conversation: Conversation) => void): void {
    this.conversationCallbacks.add(callback);
  }

  onMessageUpdate(callback: (message: Message) => void): void {
    this.messageCallbacks.add(callback);
  }

  onExpertQueueUpdate(callback: (queue: ExpertQueue) => void): void {
    this.expertQueueCallbacks.add(callback);
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.connectionStatusCallbacks.add(callback);
  }

  // Remove event handlers
  offConversationUpdate(callback: (conversation: Conversation) => void): void {
    this.conversationCallbacks.delete(callback);
  }

  offMessageUpdate(callback: (message: Message) => void): void {
    this.messageCallbacks.delete(callback);
  }

  offExpertQueueUpdate(callback: (queue: ExpertQueue) => void): void {
    this.expertQueueCallbacks.delete(callback);
  }

  offConnectionStatusChange(
    callback: (status: ConnectionStatus) => void
  ): void {
    this.connectionStatusCallbacks.delete(callback);
  }

  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // Conversation updates
    this.eventSource.addEventListener('conversation-update', (event) => {
      try {
        const conversation: Conversation = JSON.parse(event.data);
        this.conversationCallbacks.forEach(callback => callback(conversation));
      } catch (error) {
        console.error('SSE: Error parsing conversation update:', error);
      }
    });

    // Message updates
    this.eventSource.addEventListener('message-update', (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        this.messageCallbacks.forEach(callback => callback(message));
      } catch (error) {
        console.error('SSE: Error parsing message update:', error);
      }
    });

    // Expert queue updates
    this.eventSource.addEventListener('expert-queue-update', (event) => {
      try {
        const queue: ExpertQueue = JSON.parse(event.data);
        this.expertQueueCallbacks.forEach(callback => callback(queue));
      } catch (error) {
        console.error('SSE: Error parsing expert queue update:', error);
      }
    });

    // Heartbeat (keep-alive)
    this.eventSource.addEventListener('heartbeat', () => {
      // Connection alive
    });

    // Connection opened
    this.eventSource.onopen = () => {
      this.notifyConnectionStatusChange({ connected: true });
    };

    // Error handling
    this.eventSource.onerror = () => {
      this.notifyConnectionStatusChange({
        connected: false,
        error: 'Connection lost'
      });

      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.isRunningFlag = false;
      }
    };
  }

  private notifyConnectionStatusChange(status: ConnectionStatus): void {
    this.connectionStatusCallbacks.forEach(callback => callback(status));
  }
}
