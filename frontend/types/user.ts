export interface User {
  id: string;
  username: string;
  display_name: string;
  phone?: string;
  avatar_url?: string;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
