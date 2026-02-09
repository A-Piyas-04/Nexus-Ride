import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create a new transport request
export const createTransportRequest = async (requestData) => {
  try {
    const response = await axios.post(`${API_URL}/transport-requests`, requestData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all requests for the current faculty user
export const getMyTransportRequests = async () => {
  try {
    const response = await axios.get(`${API_URL}/transport-requests/my`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get a single request by ID
export const getTransportRequestById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/transport-requests/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
