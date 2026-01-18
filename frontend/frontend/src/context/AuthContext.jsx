import React, { useEffect, useState } from 'react';
import { getMe as getMeApi, login as loginApi, signup as signupApi } from '../services/auth';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const cachedEmail = localStorage.getItem('user_email');
    const cachedFullName = localStorage.getItem('full_name');

    if (cachedEmail || cachedFullName) {
      setUser({
        email: cachedEmail || undefined,
        full_name: cachedFullName || undefined,
      });
    }

    const hydrateUser = async () => {
      setLoading(true);
      try {
        const me = await getMeApi(token);
        setUser(me);

        if (me?.email) localStorage.setItem('user_email', me.email);
        if (me?.full_name) localStorage.setItem('full_name', me.full_name);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('full_name');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginApi({ email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_email', email);
      setUser({ email });

      try {
        const me = await getMeApi(data.access_token);
        setUser(me);

        if (me?.email) localStorage.setItem('user_email', me.email);
        if (me?.full_name) localStorage.setItem('full_name', me.full_name);
      } catch {
        localStorage.removeItem('full_name');
      }
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (full_name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await signupApi({ full_name, email, password });
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('full_name');
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
