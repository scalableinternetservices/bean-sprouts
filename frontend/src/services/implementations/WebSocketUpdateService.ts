import type {
  UpdateService,
  Conversation,
  Message,
  ExpertQueue,
  ConnectionStatus,
} from '@/types';

interface WebSocketUpdateServiceConfig {
  wsUrl: string;
  maxReconnectAttempts: number;
}

/**
 * WebSocket implementation of UpdateService
 * This will be fully implemented in a future step
 */
export class WebSocketUpdateService implements UpdateService {
  private config: WebSocketUpdateServiceConfig;
  private isRunningFlag: boolean = false;
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private conversationCallbacks: Set<(conversation: Conversation) => void> =
    new Set();
  private messageCallbacks: Set<(message: Message) => void> = new Set();
  private expertQueueCallbacks: Set<(queue: ExpertQueue) => void> = new Set();
  private connectionStatusCallbacks: Set<(status: ConnectionStatus) => void> =
    new Set();

  constructor(config: WebSocketUpdateServiceConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = true;
    this.notifyConnectionStatusChange({ connected: true });

    // TODO: Implement WebSocket connection in future step
    console.log('WebSocketUpdateService started');
  }

  async stop(): Promise<void> {
    if (!this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = false;
    this.notifyConnectionStatusChange({ connected: false });

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.reconnectAttempts = 0;
    console.log('WebSocketUpdateService stopped');
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
