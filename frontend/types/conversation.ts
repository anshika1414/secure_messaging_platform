import { User } from './user';
import { Message } from './message';

export interface ConversationMember {
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
  last_read_message_id?: string;
  user: User;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  avatar_url?: string;
  last_message_id?: string;
  last_message?: Message;
  last_activity_at: string;
  created_at: string;
  unread_count: number;
  members: ConversationMember[];
}
