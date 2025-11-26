import type { AuthService, ServiceConfig } from '@/types';
import { DummyAuthService } from '../implementations/DummyAuthService';
import { ApiAuthService } from '../implementations/ApiAuthService';

/**
 * Factory interface for creating AuthService instances
 */
export interface AuthServiceFactory {
  createService(): AuthService;
}

/**
 * Implementation of AuthServiceFactory
 * Creates AuthService instances based on configuration
 */
export class AuthServiceFactoryImpl implements AuthServiceFactory {
  private config: ServiceConfig['authService'];

  constructor(config: ServiceConfig['authService']) {
    this.config = config;
  }

  public createService(): AuthService {
    switch (this.config.type) {
      case 'dummy':
        return new DummyAuthService();
      case 'api':
        return new ApiAuthService(this.config);
      default:
        throw new Error(`Unsupported auth service type: ${this.config.type}`);
    }
  }
}
