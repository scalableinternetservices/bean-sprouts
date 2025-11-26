import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChat } from '@/contexts';
import { ChatLayout } from '@/components/layout';
import { ConversationView } from '@/components/chat';
import { ExpertPanel, ExpertQueueManager } from '@/components/expert';

export default function ChatPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    conversations,
    selectedConversationId,
    expertProfile,
    expertQueue,
    getCurrentConversation,
    getCurrentMessages,
    selectConversation,
    clearSelection,
    sendMessage,
    createConversation,
    claimConversation,
    unclaimConversation,
    resolveConversation,
    updateExpertProfile,
    isClaimingConversation,
    error,
    clearError,
  } = useChat();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'user' | 'expert'>('user');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const selectedConversation = getCurrentConversation();
  const messages = getCurrentMessages();
  const currentExpert =
    mode === 'expert' ? expertProfile?.userId || user?.id : user?.username;

  const handleModeToggle = () => {
    setMode(mode === 'user' ? 'expert' : 'user');
    // Clear conversation selection when switching modes
    clearSelection();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleConversationSelect = (id: string) => {
    selectConversation(id);
  };

  const handleNewConversation = async () => {
    try {
      const title = prompt('Enter conversation title:');
      if (title) {
        await createConversation(title);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleClaimConversation = async (id: string) => {
    try {
      await claimConversation(id);
    } catch (err) {
      console.error('Failed to claim conversation:', err);
    }
  };

  const handleUnclaimConversation = async (id: string) => {
    try {
      await unclaimConversation(id);
    } catch (err) {
      console.error('Failed to unclaim conversation:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      await sendMessage(selectedConversationId, content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Expert-specific handlers
  const handleUpdateProfile = async (
    updatedProfile: Partial<NonNullable<typeof expertProfile>>
  ) => {
    try {
      await updateExpertProfile(updatedProfile);
    } catch (err) {
      console.error('Failed to update expert profile:', err);
    }
  };

  const handleResolveConversation = async (conversationId: string) => {
    try {
      await resolveConversation(conversationId);
    } catch (err) {
      console.error('Failed to resolve conversation:', err);
    }
  };

  const handleBackToDashboard = () => {
    clearSelection();
  };

  return (
    <ChatLayout
      mode={mode}
      onModeToggle={handleModeToggle}
      onLogout={handleLogout}
      conversations={conversations}
      expertQueue={expertQueue}
      selectedConversationId={selectedConversationId || undefined}
      onConversationSelect={handleConversationSelect}
      onNewConversation={handleNewConversation}
      onClaimConversation={handleClaimConversation}
      onUnclaimConversation={handleUnclaimConversation}
      currentUser={user?.username || 'User'}
      currentExpert={currentExpert}
      isClaimingConversation={isClaimingConversation}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button
            onClick={clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {mode === 'user' ? (
        <ConversationView
          conversation={selectedConversation}
          messages={messages}
          mode={mode}
          currentExpert={currentExpert}
          onSendMessage={handleSendMessage}
          onClaimConversation={handleClaimConversation}
        />
      ) : selectedConversation ? (
        <ConversationView
          conversation={selectedConversation}
          messages={messages}
          mode={mode}
          currentExpert={currentExpert}
          onSendMessage={handleSendMessage}
          onClaimConversation={handleClaimConversation}
          onBackToDashboard={handleBackToDashboard}
        />
      ) : (
        <div className="space-y-6">
          <ExpertPanel
            expertProfile={expertProfile}
            expertQueue={expertQueue}
            onUpdateProfile={handleUpdateProfile}
            onClaimConversation={handleClaimConversation}
            onUnclaimConversation={handleUnclaimConversation}
            onResolveConversation={handleResolveConversation}
          />
          <ExpertQueueManager
            expertQueue={expertQueue}
            onClaimConversation={handleClaimConversation}
            onUnclaimConversation={handleUnclaimConversation}
            onResolveConversation={handleResolveConversation}
            onViewConversation={handleConversationSelect}
          />
        </div>
      )}
    </ChatLayout>
  );
}
