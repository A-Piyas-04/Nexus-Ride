import React, { createContext, useContext, useState } from 'react';
import { login as loginApi, signup as signupApi } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginApi({ email, password });
      localStorage.setItem('token', data.access_token);
      // In a real app, you might want to fetch user profile here
      setUser({ email }); 
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

export const useAuth = () => useContext(AuthContext);
