import type { ChatService, ChatServiceFactory } from '@/types';
import type { ChatServiceConfig } from '@/types';
import { DummyChatService } from '../implementations/DummyChatService';
import { ApiChatService } from '../implementations/ApiChatService';

/**
 * Factory for creating ChatService instances based on configuration
 */
export class ChatServiceFactoryImpl implements ChatServiceFactory {
  private config: ChatServiceConfig;

  constructor(config: ChatServiceConfig) {
    this.config = config;
  }

  /**
   * Create a ChatService instance based on the configured type
   */
  public createService(): ChatService {
    switch (this.config.type) {
      case 'dummy':
        return new DummyChatService();

      case 'api':
        if (!this.config.baseUrl) {
          throw new Error('API base URL is required for API chat service');
        }
        return new ApiChatService({
          baseUrl: this.config.baseUrl,
          timeout: this.config.timeout || 30000,
          retryAttempts: this.config.retryAttempts || 3,
        });

      default:
        throw new Error(`Unsupported chat service type: ${this.config.type}`);
    }
  }

  /**
   * Update the factory configuration
   */
  public updateConfig(config: ChatServiceConfig): void {
    this.config = config;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): ChatServiceConfig {
    return { ...this.config };
  }
}
