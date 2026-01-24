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

export const createSubscription = async (data, token) => {
  const response = await api.post('/subscription/', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getSubscription = async (token) => {
  const response = await api.get('/subscription/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getSubscriptionRequests = async (token) => {
  const response = await api.get('/subscription/requests', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const approveSubscription = async (id, token) => {
  const response = await api.put(`/subscription/${id}/approve`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const declineSubscription = async (id, token) => {
  const response = await api.put(`/subscription/${id}/decline`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getTripsAvailability = async (token) => {
  const response = await api.get('/trips/availability', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default api;
