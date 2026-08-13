import { apiRequest } from './client';
import { User } from '../../types/user';

export const usersApi = {
  search: async (query: string): Promise<User[]> => {
    if (!query.trim()) return [];
    return apiRequest<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  },

  updateProfile: async (displayName?: string, avatarUrl?: string): Promise<User> => {
    return apiRequest<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
    });
  },
};
