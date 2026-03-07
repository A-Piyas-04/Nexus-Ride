import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Adjust based on your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request detected. Clearing session...');
      localStorage.removeItem('token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('full_name');
      // We can't use useNavigate here as it's not a React component
      // but we can redirect using window.location if needed, 
      // or let the components handle it via AuthContext state changes.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

export const driverSignup = async (data) => {
  const response = await api.post('/drivers/signup', data);
  return response.data;
};

export const driverLogin = async (data) => {
  const response = await api.post('/drivers/login', data);
  return response.data;
};

export const getDriverRequests = async (token) => {
  const response = await api.get('/drivers/requests', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const approveDriver = async (id, token) => {
  const response = await api.put(`/drivers/${id}/approve`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getMyDriverProfile = async (token) => {
  const response = await api.get('/drivers/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Driver: my assigned trips (for start/complete)
export const getMyTrips = async (token) => {
  const response = await api.get('/trips/my', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const startTrip = async (tripId, token) => {
  const response = await api.patch(`/trips/${tripId}/start`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const completeTrip = async (tripId, token) => {
  const response = await api.patch(`/trips/${tripId}/complete`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateDriverProfile = async (data) => {
  const token = localStorage.getItem('token');
  const response = await api.put('/drivers/profile', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default api;
