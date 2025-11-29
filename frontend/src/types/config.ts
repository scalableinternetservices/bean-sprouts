/**
 * Configuration types for the application
 * These types support the dual-mode architecture and service layer
 */

export interface AppConfig {
  backendMode: 'dummy' | 'api';
  updateMode: 'polling' | 'sse' | 'websocket' | 'push';
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  pollingInterval?: number;
  maxReconnectAttempts?: number;
}

export interface AuthServiceConfig {
  type: 'dummy' | 'api';
  baseUrl?: string;
  timeout?: number;
}

export interface ChatServiceConfig {
  type: 'dummy' | 'api';
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface UpdateServiceConfig {
  type: 'polling' | 'sse' | 'websocket' | 'push';
  interval?: number; // for polling
  baseUrl?: string;
  wsUrl?: string; // for websocket
  maxReconnectAttempts?: number;
}

export interface ServiceConfig {
  authService: AuthServiceConfig;
  chatService: ChatServiceConfig;
  updateService: UpdateServiceConfig;
}
