import type { ChatService, UpdateService, ServiceConfig } from '@/types';
import { ChatServiceFactoryImpl } from './factories/ChatServiceFactory';
import { UpdateServiceFactoryImpl } from './factories/UpdateServiceFactory';

/**
 * Service container for dependency injection and service management
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private chatService: ChatService | null = null;
  private updateService: UpdateService | null = null;
  private chatServiceFactory: ChatServiceFactoryImpl;
  private updateServiceFactory: UpdateServiceFactoryImpl;
  private config: ServiceConfig;

  private constructor(config: ServiceConfig) {
    this.config = config;
    this.chatServiceFactory = new ChatServiceFactoryImpl(config.chatService);
    this.updateServiceFactory = new UpdateServiceFactoryImpl(
      config.updateService
    );
  }

  /**
   * Get the singleton instance of ServiceContainer
   */
  public static getInstance(config?: ServiceConfig): ServiceContainer {
    if (!ServiceContainer.instance) {
      if (!config) {
        throw new Error(
          'ServiceContainer must be initialized with configuration'
        );
      }
      ServiceContainer.instance = new ServiceContainer(config);
    }
    return ServiceContainer.instance;
  }

  /**
   * Initialize the service container with new configuration
   */
  public static initialize(config: ServiceConfig): ServiceContainer {
    ServiceContainer.instance = new ServiceContainer(config);
    return ServiceContainer.instance;
  }

  /**
   * Get the ChatService instance (lazy initialization)
   */
  public getChatService(): ChatService {
    if (!this.chatService) {
      this.chatService = this.chatServiceFactory.createService();
    }
    return this.chatService;
  }

  /**
   * Get the UpdateService instance (lazy initialization)
   */
  public getUpdateService(): UpdateService {
    if (!this.updateService) {
      this.updateService = this.updateServiceFactory.createService();
    }
    return this.updateService;
  }

  /**
   * Update the service configuration and recreate services
   */
  public updateConfig(config: ServiceConfig): void {
    this.config = config;

    // Update factory configurations
    this.chatServiceFactory.updateConfig(config.chatService);
    this.updateServiceFactory.updateConfig(config.updateService);

    // Recreate services with new configuration
    this.chatService = null;
    this.updateService = null;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /**
   * Restart the update service with new configuration
   */
  public async restartUpdateService(): Promise<void> {
    if (this.updateService) {
      await this.updateService.stop();
    }
    this.updateService = null;
    // Service will be recreated on next access
  }

  /**
   * Check if services are initialized
   */
  public isInitialized(): boolean {
    return this.chatService !== null && this.updateService !== null;
  }

  /**
   * Get service health status
   */
  public getServiceHealth(): {
    chatService: boolean;
    updateService: boolean;
    updateServiceRunning: boolean;
  } {
    return {
      chatService: this.chatService !== null,
      updateService: this.updateService !== null,
      updateServiceRunning: this.updateService?.isRunning() || false,
    };
  }

  /**
   * Cleanup all services
   */
  public async cleanup(): Promise<void> {
    if (this.updateService) {
      await this.updateService.stop();
    }
    this.chatService = null;
    this.updateService = null;
  }
}
