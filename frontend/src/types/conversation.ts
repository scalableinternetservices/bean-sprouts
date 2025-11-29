/**
 * Conversation Status States:
 *
 * 'waiting' - Conversation is waiting for an expert to claim it
 *   - assignedExpertId is null/undefined
 *   - Questioner can send messages but no expert is responding
 *   - Appears in expert queue for claiming
 *   - ExpertAssignment status: none (not yet assigned)
 *
 * 'active' - Expert has claimed the conversation and is actively working on it
 *   - assignedExpertId is set to the expert's userId
 *   - Both questioner and expert can send messages
 *   - Expert can resolve the conversation or unclaim it
 *   - ExpertAssignment status: 'active'
 *
 * 'resolved' - Conversation has been successfully resolved by an expert
 *   - assignedExpertId remains set to the expert who resolved it
 *   - No new messages should be sent (conversation is closed)
 *   - ExpertAssignment status: 'resolved'
 *
 * Workflow:
 * 1. Conversation created → status: 'waiting', assignedExpertId: null
 * 2. Expert claims it → status: 'active', assignedExpertId: expertId
 * 3. Expert unclaims it → status: 'waiting', assignedExpertId: null
 * 4. Expert resolves it → status: 'resolved', assignedExpertId: expertId (unchanged)
 *
 * Note: Multiple experts may be assigned to the same conversation over time.
 * The assignedExpertId always reflects the current expert, while ExpertAssignment
 * provides the complete history of all expert assignments.
 */

export interface Conversation {
  id: string;
  title: string;
  status: 'waiting' | 'active' | 'resolved';
  questionerId: string;
  questionerUsername: string;
  assignedExpertId?: string | null;
  assignedExpertUsername?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface CreateConversationRequest {
  title: string;
  initialMessage?: string;
}

export interface UpdateConversationRequest {
  title?: string;
  status?: Conversation['status'];
  assignedExpertId?: string;
}
