import { Message } from './message';

export type WSEventType = 
  | 'SEND_MESSAGE'
  | 'NEW_MESSAGE'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'USER_TYPING'
  | 'MARK_READ'
  | 'RECEIPT_UPDATE'
  | 'PRESENCE_UPDATE';

export interface WSEvent<T = any> {
  event: WSEventType;
  data: T;
}

export interface TypingPayload {
  conversation_id: string;
  user_id: string;
  username: string;
  display_name: string;
  is_typing: boolean;
}

export interface ReceiptUpdatePayload {
  message_id?: string;
  conversation_id: string;
  user_id: string;
  status: 'DELIVERED' | 'READ';
  delivered_at?: string;
  read_at?: string;
}
