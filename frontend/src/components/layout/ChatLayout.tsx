import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import type { Conversation, ExpertQueue } from '@/types';

interface ChatLayoutProps {
  mode: 'user' | 'expert';
  onModeToggle: () => void;
  onLogout: () => void;
  conversations: Conversation[];
  expertQueue: ExpertQueue | null;
  selectedConversationId?: string;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onClaimConversation: (id: string) => void;
  onUnclaimConversation: (id: string) => void;
  currentUser?: string;
  currentExpert?: string;
  isClaimingConversation?: boolean;
  children: ReactNode;
}

export default function ChatLayout({
  mode,
  onModeToggle,
  onLogout,
  conversations,
  expertQueue,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  onClaimConversation,
  onUnclaimConversation,
  currentUser,
  currentExpert,
  isClaimingConversation,
  children,
}: ChatLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Global Header */}
      <div className="flex-shrink-0 border-b p-4">
        <Header
          mode={mode}
          onModeToggle={onModeToggle}
          onLogout={onLogout}
          currentUser={currentUser}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="min-w-96 flex-shrink-0 border-r p-4 flex flex-col">
          <Sidebar
            mode={mode}
            conversations={conversations}
            expertQueue={expertQueue}
            selectedConversationId={selectedConversationId}
            onConversationSelect={onConversationSelect}
            onNewConversation={onNewConversation}
            onClaimConversation={onClaimConversation}
            onUnclaimConversation={onUnclaimConversation}
            currentExpert={currentExpert}
            isClaimingConversation={isClaimingConversation}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-96">
          <MainContent>{children}</MainContent>
        </div>
      </div>
    </div>
  );
}
