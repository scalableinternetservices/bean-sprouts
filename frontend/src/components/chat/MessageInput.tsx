import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Conversation } from '@/types';

interface MessageInputProps {
  conversation?: Conversation;
  mode: 'user' | 'expert';
  onSendMessage: (content: string) => void;
  isClaimedByMe?: boolean;
}

export default function MessageInput({
  conversation: _conversation,
  mode,
  onSendMessage,
  isClaimedByMe = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canExpertSend = mode === 'expert' && isClaimedByMe;
  const canSend = mode === 'user' || canExpertSend;

  const getPlaceholder = () => {
    if (mode === 'user') {
      return 'Type your message…';
    }
    if (isClaimedByMe) {
      return 'Reply as Expert…';
    }
    return 'Claim this conversation to reply';
  };

  return (
    <div className="flex gap-2">
      <Input
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={getPlaceholder()}
        disabled={!canSend}
        className="flex-1"
      />
      <Button onClick={handleSend} disabled={!message.trim() || !canSend}>
        Send
      </Button>
    </div>
  );
}
