import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../api/auth.api';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-login on app startup: check SecureStore for persisted session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
        const storedUserJson = await SecureStore.getItemAsync(USER_STORAGE_KEY);

        if (storedToken && storedUserJson) {
          const parsedUser: User = JSON.parse(storedUserJson);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.warn('Failed to restore authentication session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    try {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, newToken);
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Error saving session to SecureStore:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing session from SecureStore:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
