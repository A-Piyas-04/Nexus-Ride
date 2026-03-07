import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');
  
  const response = await axios.post(`${API_URL}/profile/picture`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.data;
};

export const getProfilePictureUrl = (userId) => {
  if (!userId) return null;
  // Append timestamp to prevent caching issues when image is updated
  return `${API_URL}/profile/picture/${userId}?t=${new Date().getTime()}`;
};
