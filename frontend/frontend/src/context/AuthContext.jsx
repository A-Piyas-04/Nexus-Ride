import React, { useEffect, useState } from 'react';
import { getMe as getMeApi, login as loginApi, signup as signupApi } from '../services/auth';
import { AuthContext } from './auth-context';

const IUT_EMAIL_DOMAIN = '@iut-dhaka.edu';
const EMAIL_DOMAIN_ERROR_MESSAGE = 'Please use a valid university email address.';

const normalizeEmail = (value) => (value || '').trim().toLowerCase();

const isIutEmail = (value) => normalizeEmail(value).endsWith(IUT_EMAIL_DOMAIN);

const getErrorMessage = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first?.msg?.includes(IUT_EMAIL_DOMAIN)) return EMAIL_DOMAIN_ERROR_MESSAGE;
    if (first?.msg) return first.msg;
  }
  if (typeof detail === 'string') {
    if (detail.includes(IUT_EMAIL_DOMAIN)) return EMAIL_DOMAIN_ERROR_MESSAGE;
    return detail;
  }
  if (err?.message?.includes(IUT_EMAIL_DOMAIN)) return EMAIL_DOMAIN_ERROR_MESSAGE;
  return fallback;
};

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
    const normalizedEmail = normalizeEmail(email);
    try {
      if (!isIutEmail(normalizedEmail)) {
        setError(EMAIL_DOMAIN_ERROR_MESSAGE);
        window.alert(EMAIL_DOMAIN_ERROR_MESSAGE);
        throw new Error(EMAIL_DOMAIN_ERROR_MESSAGE);
      }
      const data = await loginApi({ email: normalizedEmail, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_email', normalizedEmail);
      setUser({ email: normalizedEmail });

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
      setError(getErrorMessage(err, 'Login failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (full_name, email, password) => {
    setLoading(true);
    setError(null);
    const normalizedEmail = normalizeEmail(email);
    try {
      if (!isIutEmail(normalizedEmail)) {
        setError(EMAIL_DOMAIN_ERROR_MESSAGE);
        window.alert(EMAIL_DOMAIN_ERROR_MESSAGE);
        throw new Error(EMAIL_DOMAIN_ERROR_MESSAGE);
      }
      const data = await signupApi({ full_name, email: normalizedEmail, password });
      return data;
    } catch (err) {
      setError(getErrorMessage(err, 'Signup failed'));
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
