import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth, useChatServices } from '@/contexts';
import type {
  Conversation,
  Message,
  ExpertProfile,
  ExpertQueue,
  ExpertAssignment,
} from '@/types';

interface ChatContextType {
  // State
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  selectedConversationId: string | null;
  expertProfile: ExpertProfile | null;
  expertQueue: ExpertQueue | null;
  expertAssignments: ExpertAssignment[];

  // Loading states
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingExpertData: boolean;
  isClaimingConversation: boolean;

  // Error states
  error: string | null;

  // Actions
  selectConversation: (conversationId: string) => void;
  clearSelection: () => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (title: string) => Promise<Conversation>;
  claimConversation: (conversationId: string) => Promise<void>;
  unclaimConversation: (conversationId: string) => Promise<void>;
  resolveConversation: (conversationId: string) => Promise<void>;
  updateExpertProfile: (updates: Partial<ExpertProfile>) => Promise<void>;
  loadExpertData: () => Promise<void>;

  // Utility
  getCurrentConversation: () => Conversation | null;
  getCurrentMessages: () => Message[];
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const { chatService, updateService, isServicesReady } = useChatServices();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{
    [conversationId: string]: Message[];
  }>({});
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(
    null
  );
  const [expertQueue, setExpertQueue] = useState<ExpertQueue | null>(null);
  const [expertAssignments, setExpertAssignments] = useState<
    ExpertAssignment[]
  >([]);

  // Loading states
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingExpertData, setIsLoadingExpertData] = useState(false);
  const [isClaimingConversation, setIsClaimingConversation] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Utility functions
  const getCurrentConversation = useCallback((): Conversation | null => {
    if (!selectedConversationId) return null;

    // First check main conversations list
    const mainConversation = conversations.find(
      c => c.id === selectedConversationId
    );
    if (mainConversation) return mainConversation;

    // If not found, check expert queue conversations
    if (expertQueue) {
      const waitingConversation = expertQueue.waitingConversations.find(
        c => c.id === selectedConversationId
      );
      if (waitingConversation) return waitingConversation;

      const assignedConversation = expertQueue.assignedConversations.find(
        c => c.id === selectedConversationId
      );
      if (assignedConversation) return assignedConversation;
    }

    return null;
  }, [conversations, selectedConversationId, expertQueue]);

  const getCurrentMessages = useCallback((): Message[] => {
    if (!selectedConversationId) return [];
    return messages[selectedConversationId] || [];
  }, [messages, selectedConversationId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load conversations using ChatService
  const loadConversations = useCallback(async () => {
    if (!isServicesReady || !chatService) return;

    setIsLoadingConversations(true);
    setError(null);

    try {
      const conversationsData = await chatService.getConversations();
      setConversations(conversationsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isServicesReady, chatService]);

  // Load messages using ChatService
  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!isServicesReady || !chatService) return;

      setIsLoadingMessages(true);
      setError(null);

      try {
        const messagesData = await chatService.getMessages(conversationId);
        setMessages(prev => ({
          ...prev,
          [conversationId]: messagesData,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load messages';
        setError(errorMessage);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [isServicesReady, chatService]
  );

  // Conversation selection
  const selectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      // Load messages if not already loaded
      if (!messages[conversationId]) {
        loadMessages(conversationId);
      }
    },
    [messages, loadMessages]
  );

  const clearSelection = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  // Send message using ChatService
  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!isServicesReady || !chatService || !user) return;

      try {
        const newMessage = await chatService.sendMessage({
          conversationId,
          content,
        });

        // Update local state with server response
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage],
        }));

        // Update conversation last message time
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessageAt: newMessage.timestamp,
                  updatedAt: newMessage.timestamp,
                }
              : conv
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
      }
    },
    [isServicesReady, chatService, user]
  );

  // Create conversation using ChatService
  const createConversation = useCallback(
    async (title: string): Promise<Conversation> => {
      if (!isServicesReady || !chatService || !user) {
        throw new Error('Services not ready or user not authenticated');
      }

      try {
        const newConversation = await chatService.createConversation({
          title,
        });

        // Update local state
        setConversations(prev => [newConversation, ...prev]);
        return newConversation;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create conversation';
        setError(errorMessage);
        throw err;
      }
    },
    [isServicesReady, chatService, user]
  );

  // Load expert data using ChatService
  const loadExpertData = useCallback(async () => {
    if (!isServicesReady || !chatService) return;

    setIsLoadingExpertData(true);
    setError(null);

    try {
      const [profile, queue, assignments] = await Promise.all([
        chatService.getExpertProfile(),
        chatService.getExpertQueue(),
        chatService.getExpertAssignmentHistory(),
      ]);

      setExpertProfile(profile);
      setExpertQueue(queue);
      setExpertAssignments(assignments);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load expert data';
      setError(errorMessage);
    } finally {
      setIsLoadingExpertData(false);
    }
  }, [isServicesReady, chatService]);

  // Claim conversation using ChatService
  const claimConversation = useCallback(
    async (conversationId: string) => {
      if (!isServicesReady || !chatService || isClaimingConversation) return;

      setIsClaimingConversation(true);
      try {
        await chatService.claimConversation(conversationId);

        // Update local state
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  assignedExpertId: user?.id,
                  assignedExpertUsername: user?.username,
                  status: 'active',
                  updatedAt: new Date().toISOString(),
                }
              : conv
          )
        );

        // Reload expert data to update the queue
        await loadExpertData();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to claim conversation';
        setError(errorMessage);
      } finally {
        setIsClaimingConversation(false);
      }
    },
    [isServicesReady, chatService, user, loadExpertData, isClaimingConversation]
  );

  // Unclaim conversation using ChatService
  const unclaimConversation = useCallback(
    async (conversationId: string) => {
      if (!isServicesReady || !chatService || isClaimingConversation) return;

      setIsClaimingConversation(true);
      try {
        await chatService.unclaimConversation(conversationId);

        // Update local state
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  assignedExpertId: undefined,
                  assignedExpertUsername: undefined,
                  status: 'waiting',
                  updatedAt: new Date().toISOString(),
                }
              : conv
          )
        );

        // Reload expert data to update the queue
        await loadExpertData();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to unclaim conversation';
        setError(errorMessage);
      } finally {
        setIsClaimingConversation(false);
      }
    },
    [isServicesReady, chatService, loadExpertData, isClaimingConversation]
  );

  // Resolve conversation using ChatService
  const resolveConversation = useCallback(
    async (conversationId: string) => {
      if (!isServicesReady || !chatService) return;

      try {
        await chatService.updateConversation(conversationId, {
          status: 'resolved',
        });

        // Update local state
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  status: 'resolved',
                  updatedAt: new Date().toISOString(),
                }
              : conv
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to resolve conversation';
        setError(errorMessage);
      }
    },
    [isServicesReady, chatService]
  );

  // Update expert profile using ChatService
  const updateExpertProfile = useCallback(
    async (updates: Partial<ExpertProfile>) => {
      if (!isServicesReady || !chatService) return;

      try {
        const updatedProfile = await chatService.updateExpertProfile(updates);
        setExpertProfile(updatedProfile);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update expert profile';
        setError(errorMessage);
      }
    },
    [isServicesReady, chatService]
  );

  const value: ChatContextType = {
    // State
    conversations,
    messages,
    selectedConversationId,
    expertProfile,
    expertQueue,
    expertAssignments,

    // Loading states
    isLoadingConversations,
    isLoadingMessages,
    isLoadingExpertData,
    isClaimingConversation,

    // Error state
    error,

    // Actions
    selectConversation,
    clearSelection,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    claimConversation,
    unclaimConversation,
    resolveConversation,
    updateExpertProfile,
    loadExpertData,

    // Utility
    getCurrentConversation,
    getCurrentMessages,
    clearError,
  };

  // Set up real-time updates from UpdateService
  useEffect(() => {
    if (!isServicesReady || !updateService) return;

    const handleConversationUpdate = (conversation: Conversation) => {
      setConversations(prev =>
        prev.map(conv => (conv.id === conversation.id ? conversation : conv))
      );
    };

    const handleMessageUpdate = (message: Message) => {
      setMessages(prev => {
        const existingMessages = prev[message.conversationId] || [];

        // Check if message already exists (by ID)
        const messageExists = existingMessages.some(m => m.id === message.id);

        if (messageExists) {
          // Check if the message content has actually changed
          const existingMessage = existingMessages.find(
            m => m.id === message.id
          );
          if (existingMessage && existingMessage.content === message.content) {
            // Message content hasn't changed, return previous state to avoid re-render
            return prev;
          }

          // Message content changed, update it
          return {
            ...prev,
            [message.conversationId]: existingMessages.map(m =>
              m.id === message.id ? message : m
            ),
          };
        } else {
          // Add new message (insert in chronological order)
          const updatedMessages = [...existingMessages, message].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          return {
            ...prev,
            [message.conversationId]: updatedMessages,
          };
        }
      });
    };

    const handleExpertQueueUpdate = (queue: ExpertQueue) => {
      setExpertQueue(queue);
    };

    // Register event handlers
    updateService.onConversationUpdate(handleConversationUpdate);
    updateService.onMessageUpdate(handleMessageUpdate);
    updateService.onExpertQueueUpdate(handleExpertQueueUpdate);

    // Cleanup
    return () => {
      updateService.offConversationUpdate(handleConversationUpdate);
      updateService.offMessageUpdate(handleMessageUpdate);
      updateService.offExpertQueueUpdate(handleExpertQueueUpdate);
    };
  }, [isServicesReady, updateService]);

  // Load initial data when services are ready
  useEffect(() => {
    if (isServicesReady) {
      loadConversations();
      loadExpertData();
    }
  }, [isServicesReady, loadConversations, loadExpertData]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && isServicesReady) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, isServicesReady, loadMessages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
