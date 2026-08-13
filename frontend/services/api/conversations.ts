import { apiRequest } from './client';
import { Conversation } from '../../types/conversation';
import { Message } from '../../types/message';

export interface PaginatedMessages {
  messages: Message[];
  next_cursor?: string;
  has_more: boolean;
}

export const conversationsApi = {
  getConversations: async (): Promise<Conversation[]> => {
    return apiRequest<Conversation[]>('/conversations');
  },

  createDirect: async (targetUserId: string): Promise<Conversation> => {
    return apiRequest<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
  },

  getMessages: async (conversationId: string, cursor?: string, limit: number = 50): Promise<PaginatedMessages> => {
    let url = `/conversations/${conversationId}/messages?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    return apiRequest<PaginatedMessages>(url);
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await apiRequest(`/conversations/${conversationId}/read`, { method: 'POST' });
  },

  createGroup: async (name: string, memberIds: string[]): Promise<{ status: string; group_id: string; conversation_id: string }> => {
    return apiRequest('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, member_ids: memberIds }),
    });
  },

  addGroupMember: async (groupId: string, userId: string, role: string = 'MEMBER'): Promise<void> => {
    await apiRequest(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },

  removeGroupMember: async (groupId: string, userId: string): Promise<void> => {
    await apiRequest(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  },
};
