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

// TO: Get all requests
export const getAllTransportRequests = async (status_filter = null) => {
  try {
    const params = status_filter ? { status_filter } : {};
    const response = await axios.get(`${API_URL}/transport-requests`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// TO: Update request status
export const updateTransportRequestStatus = async (id, status, note = null) => {
  try {
    const response = await axios.patch(
      `${API_URL}/transport-requests/${id}/status`,
      { status, note },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// TO: Assign vehicle/driver
export const assignTransportRequest = async (id, assignmentData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/transport-requests/${id}/assign`,
      assignmentData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// TO: Get vehicles
export const getVehicles = async () => {
  try {
    const response = await axios.get(`${API_URL}/transport-requests/vehicles`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// TO: Get drivers
export const getDrivers = async () => {
  try {
    const response = await axios.get(`${API_URL}/transport-requests/drivers`, {
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

// Route Management
export const createRoute = async (routeData) => {
  try {
    const response = await axios.post(`${API_URL}/routes`, routeData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRoutes = async () => {
  try {
    const response = await axios.get(`${API_URL}/routes`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRoute = async (id, routeData) => {
  try {
    const response = await axios.patch(`${API_URL}/routes/${id}`, routeData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const syncRouteStops = async (id, stopsData) => {
  try {
    const response = await axios.put(`${API_URL}/routes/${id}/stops`, stopsData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

