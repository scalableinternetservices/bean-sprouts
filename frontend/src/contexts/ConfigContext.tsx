import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import ConfigService from '@/services/ConfigService';
import type { AppConfig, ServiceConfig } from '@/types';

interface ConfigContextType {
  // State
  config: AppConfig;
  serviceConfig: ServiceConfig;
  isLoading: boolean;
  error: string | null;

  // Actions
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
  validateConfig: (config: AppConfig) => { isValid: boolean; errors: string[] };

  // Utility
  getAvailableOptions: () => {
    backendModes: readonly ('dummy' | 'api')[];
    updateModes: readonly ('polling' | 'sse' | 'websocket' | 'push')[];
    defaultConfig: AppConfig;
  };
  clearError: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(() =>
    ConfigService.getInstance().getConfig()
  );
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>(() =>
    ConfigService.getInstance().getServiceConfig()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to configuration changes
  useEffect(() => {
    const unsubscribe = ConfigService.getInstance().subscribe(newConfig => {
      setConfig(newConfig);
      setServiceConfig(ConfigService.getInstance().getServiceConfig());
    });

    return unsubscribe;
  }, []);

  const updateConfig = useCallback(
    (updates: Partial<AppConfig>) => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate the updated configuration
        const updatedConfig = { ...config, ...updates };
        const validation =
          ConfigService.getInstance().validateConfig(updatedConfig);

        if (!validation.isValid) {
          setError(
            `Configuration validation failed: ${validation.errors.join(', ')}`
          );
          setIsLoading(false);
          return;
        }

        // Update configuration
        ConfigService.getInstance().updateConfig(updates);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update configuration';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [config]
  );

  const resetConfig = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      ConfigService.getInstance().resetConfig();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reset configuration';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateConfig = useCallback((configToValidate: AppConfig) => {
    return ConfigService.getInstance().validateConfig(configToValidate);
  }, []);

  const getAvailableOptions = useCallback(() => {
    return ConfigService.getInstance().getAvailableOptions();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ConfigContextType = {
    // State
    config,
    serviceConfig,
    isLoading,
    error,

    // Actions
    updateConfig,
    resetConfig,
    validateConfig,

    // Utility
    getAvailableOptions,
    clearError,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
