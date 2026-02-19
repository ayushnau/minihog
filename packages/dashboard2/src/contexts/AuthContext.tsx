import React, { createContext, useContext, useState, useCallback } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('minihog_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading] = useState(false);

  const login = useCallback(async (username: string, _password: string) => {
    // Mock login
    const u: User = { id: '1', username, email: `${username}@example.com` };
    setUser(u);
    localStorage.setItem('minihog_user', JSON.stringify(u));
  }, []);

  const register = useCallback(async (username: string, email: string, _password: string) => {
    const u: User = { id: '1', username, email };
    setUser(u);
    localStorage.setItem('minihog_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('minihog_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
