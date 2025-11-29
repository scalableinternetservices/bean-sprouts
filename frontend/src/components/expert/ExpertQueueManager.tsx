import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { ExpertQueue } from '@/types';

interface ExpertQueueManagerProps {
  expertQueue: ExpertQueue | null;
  onClaimConversation: (conversationId: string) => void;
  onUnclaimConversation: (conversationId: string) => void;
  onResolveConversation: (conversationId: string) => void;
  onViewConversation: (conversationId: string) => void;
}

export default function ExpertQueueManager({
  expertQueue,
  onClaimConversation,
  onUnclaimConversation,
  onResolveConversation,
  onViewConversation,
}: ExpertQueueManagerProps) {
  const waitingConversations = expertQueue?.waitingConversations || [];

  const assignedConversations = expertQueue?.assignedConversations || [];

  const getConversationAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const getPriorityColor = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) return 'destructive';
    if (diffHours > 4) return 'default';
    return 'secondary';
  };

  if (!expertQueue) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Unable to load queue data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Waiting Conversations */}
      <div id="unclaimed-conversations">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waiting for Expert ({waitingConversations.length})
              </CardTitle>
              <Badge variant="outline">
                {waitingConversations.length} unclaimed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {waitingConversations.length > 0 ? (
              <div className="space-y-3">
                {waitingConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={getPriorityColor(conversation.createdAt)}
                          >
                            {getConversationAge(conversation.createdAt)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Created{' '}
                            {new Date(
                              conversation.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onClaimConversation(conversation.id)}
                      >
                        Claim
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewConversation(conversation.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations waiting for an expert</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Conversations */}
      <div id="active-conversations">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                My Active Conversations ({assignedConversations.length})
              </CardTitle>
              <Badge variant="outline">
                {assignedConversations.length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {assignedConversations.length > 0 ? (
              <div className="space-y-3">
                {assignedConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">Active</Badge>
                          <span className="text-xs text-gray-500">
                            Last message{' '}
                            {new Date(
                              conversation.lastMessageAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewConversation(conversation.id)}
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResolveConversation(conversation.id)}
                      >
                        Resolve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onUnclaimConversation(conversation.id)}
                      >
                        Unclaim
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active conversations</p>
                <p className="text-sm">
                  Claim a conversation above to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
