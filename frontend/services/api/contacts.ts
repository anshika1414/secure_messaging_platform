import { apiRequest } from './client';
import { User } from '../../types/user';

export interface ContactResponse {
  user_id: string;
  contact_user_id: string;
  contact_user: User;
  created_at: string;
}

export const contactsApi = {
  getContacts: async (): Promise<ContactResponse[]> => {
    return apiRequest<ContactResponse[]>('/contacts');
  },

  addContact: async (contactUserId: string): Promise<ContactResponse> => {
    return apiRequest<ContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify({ contact_user_id: contactUserId }),
    });
  },

  removeContact: async (contactUserId: string): Promise<void> => {
    await apiRequest(`/contacts/${contactUserId}`, {
      method: 'DELETE',
    });
  },
};
