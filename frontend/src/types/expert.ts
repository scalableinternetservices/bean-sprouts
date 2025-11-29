import type { Conversation } from './conversation';

export interface ExpertProfile {
  id: string;
  userId: string;
  bio: string;
  knowledgeBaseLinks: string[];
}

export interface ExpertQueue {
  waitingConversations: Conversation[]; // conversations waiting for some expert to claim them
  assignedConversations: Conversation[]; // conversations this expert has claimed and is actively working on
}

/**
 * ExpertAssignment Status States:
 *
 * 'active' - Expert is currently assigned and working on the conversation
 *   - assignedAt is set, unassignedAt is null
 *   - Expert can send messages, resolve the conversation, or unclaim it
 *   - Conversation.assignedExpertId = expertId, Conversation.status = 'active'
 *
 * 'unassigned' - Expert was assigned but then unclaimed the conversation
 *   - assignedAt and unassignedAt are both set
 *   - Conversation goes back to waiting status for another expert
 *   - Conversation.assignedExpertId = null, Conversation.status = 'waiting'
 *
 * 'resolved' - Expert successfully resolved the conversation
 *   - assignedAt and unassignedAt are both set
 *   - Conversation is closed and no longer needs expert attention
 *   - Conversation.status = 'resolved'
 *
 * Workflow:
 * 1. Conversation created → status: 'waiting', no expert assigned
 * 2. Expert claims it → ExpertAssignment created with status: 'active'
 * 3. Expert unclaims it → ExpertAssignment updated to status: 'unassigned'
 * 4. Expert resolves it → ExpertAssignment updated to status: 'resolved'
 *
 * This provides complete audit trail of expert involvement in each conversation.
 */
export interface ExpertAssignment {
  id: string;
  conversationId: string;
  expertId: string;
  assignedAt: string;
  unassignedAt?: string;
  status: 'active' | 'unassigned' | 'resolved';
}

export interface UpdateExpertProfileRequest {
  bio?: string;
  knowledgeBaseLinks?: string[];
}
