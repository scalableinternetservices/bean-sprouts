import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth, useConfig } from '@/contexts';
import { ServiceContainer } from '@/services';
import type { ChatService, UpdateService } from '@/types';

// Type for update service with user context methods
interface UpdateServiceWithUserContext extends UpdateService {
  setUserContext?: (userId: string, userRole: string) => void;
  clearUserContext?: () => void;
}

interface ChatServiceContextType {
  chatService: ChatService;
  updateService: UpdateService;
  serviceContainer: ServiceContainer;
  isServicesReady: boolean;
  serviceError: string | null;
  startServices: () => Promise<void>;
  stopServices: () => Promise<void>;
}

const ChatServiceContext = createContext<ChatServiceContextType | undefined>(
  undefined
);

interface ChatServiceProviderProps {
  children: ReactNode;
}

export function ChatServiceProvider({ children }: ChatServiceProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { serviceConfig } = useConfig();

  const [isServicesReady, setIsServicesReady] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Initialize service container with current configuration
  const serviceContainer = useMemo(() => {
    try {
      return ServiceContainer.getInstance(serviceConfig);
    } catch (error) {
      setServiceError(
        error instanceof Error ? error.message : 'Failed to initialize services'
      );
      throw error;
    }
  }, [serviceConfig]);

  // Get services
  const chatService = useMemo(() => {
    try {
      return serviceContainer.getChatService();
    } catch (error) {
      setServiceError(
        error instanceof Error ? error.message : 'Failed to get chat service'
      );
      throw error;
    }
  }, [serviceContainer]);

  const updateService = useMemo(() => {
    try {
      return serviceContainer.getUpdateService();
    } catch (error) {
      setServiceError(
        error instanceof Error ? error.message : 'Failed to get update service'
      );
      throw error;
    }
  }, [serviceContainer]);

  // Update user context in services when user changes
  useEffect(() => {
    if (isAuthenticated && user && updateService) {
      try {
        // Update PollingUpdateService with user context if it's the active service
        const updateServiceWithContext =
          updateService as UpdateServiceWithUserContext;
        if (updateServiceWithContext.setUserContext) {
          updateServiceWithContext.setUserContext(user.id, 'user');
        }
        setServiceError(null);
      } catch (error) {
        setServiceError(
          error instanceof Error
            ? error.message
            : 'Failed to update user context'
        );
      }
    } else if (updateService) {
      // Clear user context when user logs out
      try {
        const updateServiceWithContext =
          updateService as UpdateServiceWithUserContext;
        if (updateServiceWithContext.clearUserContext) {
          updateServiceWithContext.clearUserContext();
        }
        setServiceError(null);
      } catch (error) {
        setServiceError(
          error instanceof Error
            ? error.message
            : 'Failed to clear user context'
        );
      }
    }
  }, [isAuthenticated, user, updateService]);

  // Service lifecycle management
  const startServices = useCallback(async () => {
    try {
      setServiceError(null);
      if (updateService) {
        await updateService.start();
        console.log('Update service started');
      }
      setIsServicesReady(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start services';
      setServiceError(errorMessage);
      console.error('Failed to start update service:', error);
    }
  }, [updateService]);

  const stopServices = useCallback(async () => {
    try {
      setServiceError(null);
      if (updateService) {
        await updateService.stop();
        console.log('Update service stopped');
      }
      setIsServicesReady(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to stop services';
      setServiceError(errorMessage);
      console.error('Failed to stop update service:', error);
    }
  }, [updateService]);

  // Auto-start/stop services based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      startServices();
    } else {
      stopServices();
    }

    // Cleanup on unmount
    return () => {
      stopServices();
    };
  }, [isAuthenticated, startServices, stopServices]);

  const value: ChatServiceContextType = {
    chatService,
    updateService,
    serviceContainer,
    isServicesReady,
    serviceError,
    startServices,
    stopServices,
  };

  return (
    <ChatServiceContext.Provider value={value}>
      {children}
    </ChatServiceContext.Provider>
  );
}

export function useChatServices() {
  const context = useContext(ChatServiceContext);
  if (context === undefined) {
    throw new Error(
      'useChatServices must be used within a ChatServiceProvider'
    );
  }
  return context;
}
