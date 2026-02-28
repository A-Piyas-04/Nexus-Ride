import api from './auth';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const initiatePayment = async ({ reference_type, reference_id, payment_method }) => {
  const response = await api.post(
    '/payments/initiate',
    { reference_type, reference_id, payment_method },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const confirmPayment = async ({ payment_id, status, external_txn_id }) => {
  const response = await api.post(
    `/payments/${payment_id}/confirm`,
    { status, external_txn_id },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getMyPayments = async (filters = {}) => {
  const response = await api.get('/payments/me', {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const initiateTokenPayment = async ({
  route_id,
  pickup_stop_id,
  travel_date,
  direction,
  consumer_email,
  payment_method,
}) => {
  const response = await api.post(
    '/token/buy',
    { route_id, pickup_stop_id, travel_date, direction, consumer_email, payment_method },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

