import { useState, useEffect, useCallback } from 'react';
import { User } from '../types/user';
import { authApi } from '../services/api/auth';
import { socketClient } from '../services/websocket/socketClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('signal_token');
    const savedUser = localStorage.getItem('signal_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        socketClient.connect(savedToken);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (loginStr: string, passwordStr: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(loginStr, passwordStr);
      const userObj: User = {
        id: res.user_id,
        username: res.username,
        display_name: res.display_name,
        avatar_url: res.avatar_url,
      };

      setToken(res.access_token);
      setUser(userObj);

      localStorage.setItem('signal_token', res.access_token);
      localStorage.setItem('signal_user', JSON.stringify(userObj));

      socketClient.connect(res.access_token);
      return userObj;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    socketClient.disconnect();
    setToken(null);
    setUser(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };
}
