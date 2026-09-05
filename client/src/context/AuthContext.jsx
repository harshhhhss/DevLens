import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginUser, registerUser, fetchMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('devlens_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('devlens_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const storedToken = localStorage.getItem('devlens_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await fetchMe();
        setUser(data);
        localStorage.setItem('devlens_user', JSON.stringify(data));
      } catch (error) {
        localStorage.removeItem('devlens_token');
        localStorage.removeItem('devlens_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSession = (data) => {
    const { token: newToken, ...userData } = data;
    localStorage.setItem('devlens_token', newToken);
    localStorage.setItem('devlens_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await loginUser({ email, password });
    persistSession(data);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await registerUser({ name, email, password });
    persistSession(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('devlens_token');
    localStorage.removeItem('devlens_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
