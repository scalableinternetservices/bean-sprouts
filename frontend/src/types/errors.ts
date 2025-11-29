/**
 * Error and status types for the application
 * These types support error handling and connection status tracking
 */

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: string;
  error?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}
