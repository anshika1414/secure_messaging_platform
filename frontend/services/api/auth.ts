import { apiRequest } from './client';
import { User } from '../../types/user';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export const authApi = {
  login: async (loginStr: string, passwordStr: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginStr, password: passwordStr }),
    });
  },

  register: async (username: string, passwordStr: string, displayName: string, phone?: string): Promise<User> => {
    return apiRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password: passwordStr,
        display_name: displayName,
        phone,
      }),
    });
  },

  verifyOtp: async (phone: string, otpCode: string): Promise<{ status: string }> => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp_code: otpCode }),
    });
  },

  getMe: async (): Promise<User> => {
    return apiRequest<User>('/auth/me', { method: 'GET' });
  },

  logout: async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore logout errors
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('signal_token');
        localStorage.removeItem('signal_user');
      }
    }
  },
};
