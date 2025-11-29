export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'initiator' | 'expert';
  senderUsername: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface MessageUpdate {
  id: string;
  conversationId: string;
  content?: string;
  isRead?: boolean;
}
