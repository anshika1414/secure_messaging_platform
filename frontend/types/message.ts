import { User } from './user';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface MessageReceipt {
  user_id: string;
  status: MessageStatus;
  delivered_at?: string;
  read_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  message_type: 'TEXT' | 'SYSTEM';
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  temp_id?: string;
  receipts?: MessageReceipt[];
}
