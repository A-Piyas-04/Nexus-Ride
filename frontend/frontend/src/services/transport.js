import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create a new transport request
export const createTransportRequest = async (requestData) => {
  const response = await axios.post(`${API_URL}/transport-requests`, requestData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// TO: Get all requests
export const getAllTransportRequests = async (status_filter = null) => {
  const params = status_filter ? { status_filter } : {};
  const response = await axios.get(`${API_URL}/transport-requests`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

// TO: Update request status
export const updateTransportRequestStatus = async (id, status, note = null) => {
  const response = await axios.patch(
    `${API_URL}/transport-requests/${id}/status`,
    { status, note },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// TO: Assign vehicle/driver
export const assignTransportRequest = async (id, assignmentData) => {
  const response = await axios.patch(
    `${API_URL}/transport-requests/${id}/assign`,
    assignmentData,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// TO: Get vehicles
export const getVehicles = async () => {
  const response = await axios.get(`${API_URL}/transport-requests/vehicles`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// TO: Get drivers (for assignment dropdowns)
export const getDrivers = async () => {
  const response = await axios.get(`${API_URL}/transport-requests/drivers`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Driver management: list all driver profiles
export const getAllDrivers = async () => {
  const response = await axios.get(`${API_URL}/drivers`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAllVehicles = async () => {
  const response = await axios.get(`${API_URL}/vehicles`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateVehicleStatus = async (id, status) => {
  const response = await axios.patch(
    `${API_URL}/vehicles/${id}/status`,
    { status },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateVehicle = async (id, data) => {
  const response = await axios.patch(`${API_URL}/vehicles/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createVehicle = async (data) => {
  const response = await axios.post(`${API_URL}/vehicles`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get all requests for the current faculty user
export const getMyTransportRequests = async () => {
  const response = await axios.get(`${API_URL}/transport-requests/my`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get a single request by ID
export const getTransportRequestById = async (id) => {
  const response = await axios.get(`${API_URL}/transport-requests/by-id/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Route Management
export const createRoute = async (routeData) => {
  const response = await axios.post(`${API_URL}/routes`, routeData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getRoutes = async () => {
  const response = await axios.get(`${API_URL}/routes`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateRoute = async (id, routeData) => {
  const response = await axios.patch(`${API_URL}/routes/${id}`, routeData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const syncRouteStops = async (id, stopsData) => {
  const response = await axios.put(`${API_URL}/routes/${id}/stops`, stopsData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Trip Templates (TO only)
export const getTripTemplates = async (params = {}) => {
  const p = {};
  if (params.is_active !== undefined) p.is_active = params.is_active;
  if (params.route_id != null) p.route_id = params.route_id;
  const response = await axios.get(`${API_URL}/trip-templates`, {
    headers: getAuthHeaders(),
    params: Object.keys(p).length ? p : undefined,
  });
  return response.data;
};

export const createTripTemplate = async (data) => {
  const response = await axios.post(`${API_URL}/trip-templates`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateTripTemplate = async (id, data) => {
  const response = await axios.put(`${API_URL}/trip-templates/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteTripTemplate = async (id) => {
  await axios.delete(`${API_URL}/trip-templates/${id}`, {
    headers: getAuthHeaders(),
  });
};

// One-off manual trip (TO only) – trips are usually generated from templates
export const createTrip = async (data) => {
  const response = await axios.post(`${API_URL}/trips/`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

