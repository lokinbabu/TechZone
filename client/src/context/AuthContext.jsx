import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getToken, setToken, setAuthExpiredHandler } from '../api/client';
import { toast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Restore session on first load
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = getToken();
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const data = await api.me();
        if (!cancelled) setUser(data.user);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    setAuthExpiredHandler(() => {
      setToken(null);
      setUser(null);
      toast.info('Your session has expired. Please log in again.');
    });
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.register({ name, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
