import type {
  UpdateService,
  Conversation,
  Message,
  ExpertQueue,
  ConnectionStatus,
} from '@/types';
import TokenManager from '@/services/TokenManager';

interface PollingUpdateServiceConfig {
  interval: number;
  baseUrl?: string;
  userId?: string;
  userRole?: 'initiator' | 'expert';
}

interface PollingState {
  lastConversationUpdate: string | null;
  lastMessageUpdate: string | null;
  lastExpertQueueUpdate: string | null;
  retryCount: number;
  maxRetries: number;
  userId: string | null;
  userRole: 'initiator' | 'expert' | null;
}

/**
 * API-based polling implementation of UpdateService
 * Polls the backend for updates at regular intervals using HTTP requests
 */
export class ApiPollingUpdateService implements UpdateService {
  private config: PollingUpdateServiceConfig;
  private isRunningFlag: boolean = false;
  private intervalId: number | null = null;
  private tokenManager: TokenManager;
  private conversationCallbacks: Set<(conversation: Conversation) => void> =
    new Set();
  private messageCallbacks: Set<(message: Message) => void> = new Set();
  private expertQueueCallbacks: Set<(queue: ExpertQueue) => void> = new Set();
  private connectionStatusCallbacks: Set<(status: ConnectionStatus) => void> =
    new Set();
  private state: PollingState = {
    lastConversationUpdate: null,
    lastMessageUpdate: null,
    lastExpertQueueUpdate: null,
    retryCount: 0,
    maxRetries: 3,
    userId: null,
    userRole: null,
  };

  constructor(config: PollingUpdateServiceConfig) {
    this.config = config;
    this.tokenManager = TokenManager.getInstance();
    this.state.userId = config.userId || null;
    this.state.userRole = config.userRole || null;
  }

  async start(): Promise<void> {
    if (this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = true;
    this.notifyConnectionStatusChange({ connected: true });

    // Start polling
    this.intervalId = setInterval(() => {
      this.pollForUpdates();
    }, this.config.interval);

    console.log('ApiPollingUpdateService started');
  }

  async stop(): Promise<void> {
    if (!this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = false;
    this.notifyConnectionStatusChange({ connected: false });

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('ApiPollingUpdateService stopped');
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

  private async pollForUpdates(): Promise<void> {
    try {
      // Reset retry count on successful poll
      this.state.retryCount = 0;

      // Poll for conversation updates
      await this.pollConversationUpdates();

      // Poll for message updates
      await this.pollMessageUpdates();

      // Poll for expert queue updates
      await this.pollExpertQueueUpdates();

      // Notify successful connection
      this.notifyConnectionStatusChange({ connected: true });
    } catch (error) {
      console.error('Polling error:', error);
      this.state.retryCount++;

      if (this.state.retryCount >= this.state.maxRetries) {
        this.notifyConnectionStatusChange({
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Stop polling after max retries
        await this.stop();
      } else {
        this.notifyConnectionStatusChange({
          connected: false,
          error: `Connection issue (retry ${this.state.retryCount}/${this.state.maxRetries})`,
        });
      }
    }
  }

  private async pollConversationUpdates(): Promise<void> {
    if (this.conversationCallbacks.size === 0) return;

    try {
      // In a real implementation, this would make an API call
      // For now, we'll simulate checking for updates
      const updates = await this.fetchConversationUpdates();

      let latestTimestamp = this.state.lastConversationUpdate;

      for (const conversation of updates) {
        this.conversationCallbacks.forEach(callback => {
          try {
            callback(conversation);
          } catch (error) {
            console.error('Error in conversation callback:', error);
          }
        });

        // Track the latest conversation update timestamp
        if (
          !latestTimestamp ||
          new Date(conversation.updatedAt) > new Date(latestTimestamp)
        ) {
          latestTimestamp = conversation.updatedAt;
        }
      }

      // Update the last conversation update timestamp
      if (
        latestTimestamp &&
        latestTimestamp !== this.state.lastConversationUpdate
      ) {
        this.state.lastConversationUpdate = latestTimestamp;
      }
    } catch (error) {
      console.error('Error polling conversation updates:', error);
      throw error;
    }
  }

  private async pollMessageUpdates(): Promise<void> {
    if (this.messageCallbacks.size === 0) return;

    try {
      // In a real implementation, this would make an API call
      const updates = await this.fetchMessageUpdates();

      let latestTimestamp = this.state.lastMessageUpdate;

      for (const message of updates) {
        this.messageCallbacks.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            console.error('Error in message callback:', error);
          }
        });

        // Track the latest message timestamp
        if (
          !latestTimestamp ||
          new Date(message.timestamp) > new Date(latestTimestamp)
        ) {
          latestTimestamp = message.timestamp;
        }
      }

      // Update the last message update timestamp
      if (latestTimestamp && latestTimestamp !== this.state.lastMessageUpdate) {
        this.state.lastMessageUpdate = latestTimestamp;
      }
    } catch (error) {
      console.error('Error polling message updates:', error);
      throw error;
    }
  }

  private async pollExpertQueueUpdates(): Promise<void> {
    if (this.expertQueueCallbacks.size === 0) return;

    try {
      // In a real implementation, this would make an API call
      const updates = await this.fetchExpertQueueUpdates();

      let latestTimestamp = this.state.lastExpertQueueUpdate;

      for (const queue of updates) {
        this.expertQueueCallbacks.forEach(callback => {
          try {
            callback(queue);
          } catch (error) {
            console.error('Error in expert queue callback:', error);
          }
        });

        // For expert queue, we'll use the current timestamp since it doesn't have a single timestamp
        // In a real implementation, the queue might have a lastUpdated field
        const currentTimestamp = new Date().toISOString();
        if (
          !latestTimestamp ||
          new Date(currentTimestamp) > new Date(latestTimestamp)
        ) {
          latestTimestamp = currentTimestamp;
        }
      }

      // Update the last expert queue update timestamp
      if (
        latestTimestamp &&
        latestTimestamp !== this.state.lastExpertQueueUpdate
      ) {
        this.state.lastExpertQueueUpdate = latestTimestamp;
      }
    } catch (error) {
      console.error('Error polling expert queue updates:', error);
      throw error;
    }
  }

  // API methods with actual HTTP requests
  private async fetchConversationUpdates(): Promise<Conversation[]> {
    const token = this.tokenManager.getToken();
    if (!this.state.userId || !token) {
      console.warn(
        'ApiPollingUpdateService: Missing user context or auth token'
      );
      return [];
    }

    try {
      const sinceParam = this.state.lastConversationUpdate
        ? `?since=${this.state.lastConversationUpdate}&userId=${this.state.userId}`
        : `?userId=${this.state.userId}`;

      const url = `${this.config.baseUrl}/api/conversations/updates${sinceParam}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const conversations: Conversation[] = await response.json();
      return conversations;
    } catch (error) {
      console.error('Error fetching conversation updates:', error);
      throw error;
    }
  }

  private async fetchMessageUpdates(): Promise<Message[]> {
    const token = this.tokenManager.getToken();
    if (!this.state.userId || !token) {
      console.warn(
        'ApiPollingUpdateService: Missing user context or auth token'
      );
      return [];
    }

    try {
      const sinceParam = this.state.lastMessageUpdate
        ? `?since=${this.state.lastMessageUpdate}&userId=${this.state.userId}`
        : `?userId=${this.state.userId}`;

      const url = `${this.config.baseUrl}/api/messages/updates${sinceParam}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const messages: Message[] = await response.json();
      return messages;
    } catch (error) {
      console.error('Error fetching message updates:', error);
      throw error;
    }
  }

  private async fetchExpertQueueUpdates(): Promise<ExpertQueue[]> {
    const token = this.tokenManager.getToken();
    // if (!this.state.userId || !token || this.state.userRole !== 'expert') {
    //   console.warn(
    //     'ApiPollingUpdateService: Expert queue polling requires expert role'
    //   );
    //   return [];
    // }
    if (!this.state.userId || !token ) { // Changed from above
      console.warn(
        'ApiPollingUpdateService: Missing user context or auth token'
      );
      return [];
    }

    try {
      // const sinceParam = this.state.lastExpertQueueUpdate
      //   ? `?since=${this.state.lastExpertQueueUpdate}&expertId=${this.state.userId}`
      //   : `?expertId=${this.state.userId}`;

      // const url = `${this.config.baseUrl}/api/expert-queue/updates${sinceParam}`;
      const url = `${this.config.baseUrl}/api/expert-queue/updates?expertId=${this.state.userId}`; // Changed from above

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const expertQueues: ExpertQueue[] = await response.json();
      return expertQueues;
    } catch (error) {
      console.error('Error fetching expert queue updates:', error);
      throw error;
    }
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

  // Utility methods for external control
  public getPollingState(): PollingState {
    return { ...this.state };
  }

  public resetRetryCount(): void {
    this.state.retryCount = 0;
  }

  public updateLastTimestamps(updates: {
    conversation?: string;
    message?: string;
    expertQueue?: string;
  }): void {
    if (updates.conversation) {
      this.state.lastConversationUpdate = updates.conversation;
    }
    if (updates.message) {
      this.state.lastMessageUpdate = updates.message;
    }
    if (updates.expertQueue) {
      this.state.lastExpertQueueUpdate = updates.expertQueue;
    }
  }

  public getConfig(): PollingUpdateServiceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PollingUpdateServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // User context management methods
  public setUserContext(
    userId: string,
    userRole: 'initiator' | 'expert'
  ): void {
    this.state.userId = userId;
    this.state.userRole = userRole;

    console.log(
      `ApiPollingUpdateService: User context updated - ${userRole}: ${userId}`
    );
  }

  public clearUserContext(): void {
    this.state.userId = null;
    this.state.userRole = null;
    console.log('ApiPollingUpdateService: User context cleared');
  }

  public getUserContext(): {
    userId: string | null;
    userRole: 'initiator' | 'expert' | null;
  } {
    return {
      userId: this.state.userId,
      userRole: this.state.userRole,
    };
  }

  public isUserContextValid(): boolean {
    const token = this.tokenManager.getToken();
    return !!(this.state.userId && this.state.userRole && token);
  }
}
