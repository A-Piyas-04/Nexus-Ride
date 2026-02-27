import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get current staff profile
export const getStaffProfile = async () => {
  const response = await axios.get(`${API_URL}/staff/profile/me`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update staff profile
export const updateStaffProfile = async (profileData) => {
  const response = await axios.put(`${API_URL}/staff/profile`, profileData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
