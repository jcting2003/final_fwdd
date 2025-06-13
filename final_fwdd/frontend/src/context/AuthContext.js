// frontend/src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  login as apiLogin,
  signup as apiSignup,
  getCurrentUser as apiGetCurrentUser,
  logout as apiLogout
} from '../api/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check existing session
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGetCurrentUser();
        setUser(data.user);           // either user or null
      } catch {
        //setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async ({ username, password }) => {
    const res = await apiLogin({ username, password });
    if (!res.user) throw new Error(res.message || 'Login failed');
    setUser(res.user);       // ← immediate context update
    return res.user;
  };

  const signup = async (data) => {
    const res = await apiSignup(data);
    if (res.user) setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
