import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  mode: 'user' | 'expert';
}

export default function MessageList({ messages, mode }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        {mode === 'user'
          ? 'No messages yet. Ask your question to get started.'
          : 'No messages yet. Claim the conversation to reply.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map(message => (
        <Card key={message.id}>
          <CardHeader>
            <div className="flex justify-between">
              <span className="font-bold">{message.senderUsername}</span>
              <span className="text-sm text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-left">{message.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
