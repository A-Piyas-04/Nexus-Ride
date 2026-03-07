import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getNotifications = async (limit = 10, offset = 0) => {
  const response = await axios.get(`${API_URL}/notifications`, {
    headers: getAuthHeaders(),
    params: { limit, offset },
  });
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await axios.patch(
    `${API_URL}/notifications/${id}/read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await axios.patch(
    `${API_URL}/notifications/read-all`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteNotification = async (id) => {
  await axios.delete(`${API_URL}/notifications/${id}`, {
    headers: getAuthHeaders(),
  });
};
