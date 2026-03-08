import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getRidershipOverTime = async (days = 14) => {
  const response = await axios.get(`${API_URL}/analytics/ridership-over-time`, {
    headers: getAuthHeaders(),
    params: { days },
  });
  return response.data;
};

export const getRidershipByRoute = async (days = 30) => {
  const response = await axios.get(`${API_URL}/analytics/ridership-by-route`, {
    headers: getAuthHeaders(),
    params: { days },
  });
  return response.data;
};

export const getRevenueOverTime = async (days = 14) => {
  const response = await axios.get(`${API_URL}/analytics/revenue-over-time`, {
    headers: getAuthHeaders(),
    params: { days },
  });
  return response.data;
};
