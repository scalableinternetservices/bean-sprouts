import type { AppConfig, ServiceConfig } from '@/types';

/**
 * Configuration service for managing app-wide settings
 * Supports environment-based configuration and runtime switching
 */
class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;
  private listeners: Set<(config: AppConfig) => void> = new Set();
  private readonly STORAGE_KEY = 'chat-app-config';

  private constructor() {
    this.config = this.loadInitialConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Load initial configuration from localStorage, environment variables, and defaults
   */
  private loadInitialConfig(): AppConfig {
    // Try to load from localStorage first
    const savedConfig = this.loadFromStorage();
    if (savedConfig) {
      return savedConfig;
    }

    // Fall back to environment-based configuration
    const backendMode =
      (import.meta.env.VITE_BACKEND_MODE as 'dummy' | 'api') || 'dummy';
    const updateMode =
      (import.meta.env.VITE_UPDATE_MODE as
        | 'polling'
        | 'sse'
        | 'websocket'
        | 'push') || 'polling';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL;
    const pollingInterval = parseInt(
      import.meta.env.VITE_POLLING_INTERVAL || '5000'
    );
    const maxReconnectAttempts = parseInt(
      import.meta.env.VITE_MAX_RECONNECT_ATTEMPTS || '5'
    );

    const config = {
      backendMode,
      updateMode,
      apiBaseUrl,
      wsBaseUrl,
      pollingInterval,
      maxReconnectAttempts,
    };

    // Save the default config to localStorage
    this.saveToStorage(config);
    return config;
  }

  /**
   * Get current configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage(this.config);
    this.notifyListeners();
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    this.clearFromStorage();
    this.loadInitialConfig();
    this.notifyListeners();
  }

  /**
   * Get service-specific configuration
   */
  public getServiceConfig(): ServiceConfig {
    return {
      authService: {
        type: this.config.backendMode,
        baseUrl: this.config.apiBaseUrl,
        timeout: 30000,
      },
      chatService: {
        type: this.config.backendMode,
        baseUrl: this.config.apiBaseUrl,
        timeout: 30000,
      },
      updateService: {
        type: this.config.updateMode,
        interval: this.config.pollingInterval,
        baseUrl: this.config.apiBaseUrl,
      },
    };
  }

  /**
   * Save configuration to localStorage
   */
  private saveToStorage(config: AppConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadFromStorage(): AppConfig | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as AppConfig;
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
    return null;
  }

  /**
   * Clear configuration from localStorage
   */
  private clearFromStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(listener: (config: AppConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfig());
      } catch (error) {
        console.error('Error in config listener:', error);
      }
    });
  }

  /**
   * Validate configuration
   */
  public validateConfig(config: AppConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.backendMode === 'api' && !config.apiBaseUrl) {
      errors.push('API base URL is required when backend mode is "api"');
    }

    if (config.updateMode === 'websocket' && !config.wsBaseUrl) {
      errors.push(
        'WebSocket base URL is required when update mode is "websocket"'
      );
    }

    if (config.pollingInterval && config.pollingInterval < 1000) {
      errors.push('Polling interval must be at least 1000ms');
    }

    if (config.maxReconnectAttempts && config.maxReconnectAttempts < 1) {
      errors.push('Max reconnect attempts must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available configuration options
   */
  public getAvailableOptions() {
    return {
      backendModes: ['dummy', 'api'] as const,
      updateModes: ['polling', 'sse', 'websocket', 'push'] as const,
      defaultConfig: this.loadInitialConfig(),
    };
  }
}

export default ConfigService;
