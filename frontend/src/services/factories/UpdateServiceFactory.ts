import type { UpdateService, UpdateServiceFactory } from '@/types';
import type { UpdateServiceConfig } from '@/types';
import { ApiPollingUpdateService } from '../implementations/ApiPollingUpdateService';
import { SSEUpdateService } from '../implementations/SSEUpdateService';
import { WebSocketUpdateService } from '../implementations/WebSocketUpdateService';
import { PushUpdateService } from '../implementations/PushUpdateService';

/**
 * Factory for creating UpdateService instances based on configuration
 */
export class UpdateServiceFactoryImpl implements UpdateServiceFactory {
  private config: UpdateServiceConfig;

  constructor(config: UpdateServiceConfig) {
    this.config = config;
  }

  /**
   * Create an UpdateService instance based on the configured type
   */
  public createService(): UpdateService {
    switch (this.config.type) {
      case 'polling':
        return new ApiPollingUpdateService({
          interval: this.config.interval || 5000,
          baseUrl: this.config.baseUrl,
        });

      case 'sse':
        if (!this.config.baseUrl) {
          throw new Error('Base URL is required for SSE update service');
        }
        return new SSEUpdateService({
          baseUrl: this.config.baseUrl,
        });

      case 'websocket':
        if (!this.config.wsUrl) {
          throw new Error(
            'WebSocket URL is required for WebSocket update service'
          );
        }
        return new WebSocketUpdateService({
          wsUrl: this.config.wsUrl,
          maxReconnectAttempts: this.config.maxReconnectAttempts || 5,
        });

      case 'push':
        return new PushUpdateService({
          maxReconnectAttempts: this.config.maxReconnectAttempts || 5,
        });

      default:
        throw new Error(`Unsupported update service type: ${this.config.type}`);
    }
  }

  /**
   * Update the factory configuration
   */
  public updateConfig(config: UpdateServiceConfig): void {
    this.config = config;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): UpdateServiceConfig {
    return { ...this.config };
  }
}
