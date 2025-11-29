import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Conversation, ExpertQueue } from '@/types';

interface SidebarProps {
  mode: 'user' | 'expert';
  conversations: Conversation[];
  expertQueue: ExpertQueue | null;
  selectedConversationId?: string;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onClaimConversation: (id: string) => void;
  onUnclaimConversation: (id: string) => void;
  currentExpert?: string;
  isClaimingConversation?: boolean;
}

export default function Sidebar({
  mode,
  conversations,
  expertQueue,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  onClaimConversation,
  onUnclaimConversation,
  isClaimingConversation = false,
}: SidebarProps) {
  const unclaimedConversations = expertQueue?.waitingConversations || [];
  const myConversations = expertQueue?.assignedConversations || [];

  // Sort conversations for user mode according to the specified ordering
  const sortUserConversations = (conversations: Conversation[]) => {
    return [...conversations].sort((a, b) => {
      // 1. Currently selected conversation first
      if (a.id === selectedConversationId) return -1;
      if (b.id === selectedConversationId) return 1;

      // 2. Order by most recent lastMessageAt first (descending)
      const aLastMessage = new Date(a.lastMessageAt).getTime();
      const bLastMessage = new Date(b.lastMessageAt).getTime();
      if (aLastMessage !== bLastMessage) {
        return bLastMessage - aLastMessage;
      }

      // 3. Break tie using updatedAt (most recent first)
      const aUpdated = new Date(a.updatedAt).getTime();
      const bUpdated = new Date(b.updatedAt).getTime();
      if (aUpdated !== bUpdated) {
        return bUpdated - aUpdated;
      }

      // 4. Finally break tie using id (ascending for consistency)
      return a.id.localeCompare(b.id);
    });
  };

  if (mode === 'user') {
    const sortedConversations = sortUserConversations(conversations);
    return (
      <div className="space-y-2 overflow-y-auto">
        <Button onClick={onNewConversation} className="mb-4 w-full">
          + New
        </Button>
        {sortedConversations.map(conv => (
          <Card
            key={conv.id}
            className={`cursor-pointer pt-1 pb-0 ${
              conv.id === selectedConversationId ? 'border-blue-500' : ''
            }`}
            onClick={() => onConversationSelect(conv.id)}
          >
            <CardHeader className="px-0">
              <div className="text-left px-1 space-y-2">
                <CardTitle className="text-sm break-words text-left">
                  {conv.title}
                </CardTitle>
                <span
                  className={`text-xs py-0.5 ${
                    conv.assignedExpertId ? '' : 'opacity-70'
                  }`}
                >
                  {conv.assignedExpertId
                    ? `Assigned Expert: ${conv.assignedExpertUsername || conv.assignedExpertId}`
                    : 'Waiting for Expert'}
                </span>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  // Expert mode
  return (
    <div className="space-y-6 overflow-y-auto">
      {/* Unclaimed conversations */}
      <div>
        <h3 className="font-bold mb-2">Unclaimed</h3>
        {unclaimedConversations.map(conv => (
          <Card key={conv.id} className="cursor-pointer pt-1 pb-1 mb-2 ">
            <CardHeader
              className="px-1"
              onClick={() => onConversationSelect(conv.id)}
            >
              <CardTitle className="text-sm break-words text-left">
                {conv.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                onClick={() => onClaimConversation(conv.id)}
                disabled={isClaimingConversation}
              >
                {isClaimingConversation ? 'Claiming...' : 'Claim'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onConversationSelect(conv.id)}
              >
                Open
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My conversations */}
      <div>
        <h3 className="font-bold mb-2">My Conversations</h3>
        {myConversations.map(conv => (
          <Card
            key={conv.id}
            className={`cursor-pointer py-1 mb-2 ${
              conv.id === selectedConversationId ? 'border-blue-500' : ''
            }`}
            onClick={() => onConversationSelect(conv.id)}
          >
            <CardHeader className="px-1">
              <div className="space-y-2">
                <CardTitle className="text-sm break-words text-left">
                  {conv.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => onUnclaimConversation(conv.id)}
              >
                Unclaim
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
