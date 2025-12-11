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
    console.log('[SSE] start() called, isRunning:', this.isRunningFlag);

    if (this.isRunningFlag) {
      console.log('[SSE] Already running, skipping start');
      return;
    }

    this.isRunningFlag = true;

    // Get auth token
    const token = this.tokenManager.getToken();
    console.log('[SSE] Auth token available:', !!token);

    if (!token) {
      console.error('SSEUpdateService: No auth token available');
      this.notifyConnectionStatusChange({
        connected: false,
        error: 'No authentication token'
      });
      return;
    }

    // Create SSE connection with auth token in query param
    const url = `${this.config.baseUrl}/api/updates/stream?token=${encodeURIComponent(token)}`;
    console.log('[SSE] Connecting to:', url.replace(/token=[^&]+/, 'token=REDACTED'));

    try {
      this.eventSource = new EventSource(url, {
        withCredentials: true  // Send cookies too
      });

      this.setupEventListeners();
      console.log('[SSE] SSEUpdateService started, waiting for connection...');
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
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

    console.log('SSEUpdateService stopped');
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
        this.conversationCallbacks.forEach(callback => {
          try {
            callback(conversation);
          } catch (error) {
            console.error('Error in conversation callback:', error);
          }
        });
      } catch (error) {
        console.error('Error parsing conversation update:', error);
      }
    });

    // Message updates
    this.eventSource.addEventListener('message-update', (event) => {
      console.log('[SSE] Received message-update event:', event.data);
      try {
        const message: Message = JSON.parse(event.data);
        console.log('[SSE] Parsed message:', message);
        console.log('[SSE] Notifying', this.messageCallbacks.size, 'callbacks');
        this.messageCallbacks.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            console.error('Error in message callback:', error);
          }
        });
      } catch (error) {
        console.error('Error parsing message update:', error);
      }
    });

    // Expert queue updates
    this.eventSource.addEventListener('expert-queue-update', (event) => {
      try {
        const queue: ExpertQueue = JSON.parse(event.data);
        this.expertQueueCallbacks.forEach(callback => {
          try {
            callback(queue);
          } catch (error) {
            console.error('Error in expert queue callback:', error);
          }
        });
      } catch (error) {
        console.error('Error parsing expert queue update:', error);
      }
    });

    // Heartbeat (keep-alive)
    this.eventSource.addEventListener('heartbeat', () => {
      // Just acknowledge connection is alive
      console.log('[SSE] ❤️ Heartbeat received');
    });

    // Connection opened
    this.eventSource.onopen = () => {
      console.log('[SSE] ✅ Connection opened successfully!');
      this.notifyConnectionStatusChange({ connected: true });
    };

    // Error handling
    this.eventSource.onerror = (error) => {
      console.error('[SSE] ❌ Error occurred:', error);
      console.error('[SSE] ReadyState:', this.eventSource?.readyState);
      console.error('[SSE] ReadyState values: CONNECTING=0, OPEN=1, CLOSED=2');
      this.notifyConnectionStatusChange({
        connected: false,
        error: 'Connection lost'
      });

      // EventSource will automatically reconnect, but we should track the state
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        console.error('[SSE] Connection CLOSED permanently');
        this.isRunningFlag = false;
      }
    };
  }

  private notifyConnectionStatusChange(status: ConnectionStatus): void {
    this.connectionStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection status callback:', error);
      }
    });
  }
}
