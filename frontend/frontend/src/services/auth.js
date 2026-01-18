import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Adjust based on your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const signup = async (data) => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

export const getMe = async (token) => {
  const response = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default api;
