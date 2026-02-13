import api from './auth';

export const getRoutes = async () => {
  const response = await api.get('/routes');
  return response.data;
};

export const getRoute = async (id) => {
  const response = await api.get(`/routes/${id}`);
  return response.data;
};

export const createRoute = async (data, token) => {
  const response = await api.post('/routes', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateRoute = async (id, data, token) => {
  const response = await api.patch(`/routes/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteRoute = async (id, token) => {
  const response = await api.delete(`/routes/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const addStopToRoute = async (routeId, data, token) => {
  const response = await api.post(`/routes/${routeId}/stops`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateStop = async (stopId, data, token) => {
  const response = await api.patch(`/routes/stops/${stopId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteStop = async (stopId, token) => {
  const response = await api.delete(`/routes/stops/${stopId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const syncRouteStops = async (routeId, stops, token) => {
  const response = await api.put(`/routes/${routeId}/stops/sync`, stops, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
