import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronDown, ChevronRight, Bus } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { Button } from '../../components/ui/Button';
import { getMyTrips, getTripPassengers } from '../../services/auth';

function formatDate(str) {
  if (!str) return '—';
  return String(str).slice(0, 10);
}

function formatTime(str) {
  if (!str) return '—';
  const s = String(str);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function SeatTypeBadge({ type }) {
  const colors = {
    SUBSCRIPTION: 'bg-blue-100 text-blue-800',
    TOKEN: 'bg-amber-100 text-amber-800',
    GUEST: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  );
}

export default function DriverPassengerListPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [passengersByTripId, setPassengersByTripId] = useState({});
  const [loadingPassengers, setLoadingPassengers] = useState({});
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchTrips = useCallback(async () => {
    if (!token) {
      setError('You must be logged in to view passenger lists.');
      setTrips([]);
      setLoading(false);
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getMyTrips(token);
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load trips.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const fetchPassengers = useCallback(async (tripId) => {
    if (!token) return;
    setLoadingPassengers((prev) => ({ ...prev, [tripId]: true }));
    try {
      const list = await getTripPassengers(tripId, token);
      setPassengersByTripId((prev) => ({ ...prev, [tripId]: list }));
    } catch (err) {
      setPassengersByTripId((prev) => ({ ...prev, [tripId]: null }));
      setError(err?.response?.data?.detail || 'Failed to load passengers.');
    } finally {
      setLoadingPassengers((prev) => ({ ...prev, [tripId]: false }));
    }
  }, [token]);

  const toggleTrip = (tripId) => {
    setExpandedTripId((prev) => (prev === tripId ? null : tripId));
    if (!passengersByTripId[tripId] && passengersByTripId[tripId] !== null) {
      fetchPassengers(tripId);
    }
  };

  return (
    <DashboardLayout>
      <div className="pl-4 md:pl-32">
        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="max-w-6xl space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-7 h-7 text-primary-600" />
                Passenger lists
              </h1>
              <Button variant="secondary" onClick={() => navigate('/driver-dashboard')}>
                Back to dashboard
              </Button>
            </div>
            <p className="text-gray-600">
              Select a trip to see passengers (subscribers and token holders) for that trip.
            </p>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
            {loading ? (
              <p className="text-gray-500">Loading your trips...</p>
            ) : trips.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-8 text-center">
                <Bus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No trips assigned.</p>
                <p className="text-sm text-gray-500 mt-1">Passenger lists will appear here when you have assigned trips.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => {
                  const isExpanded = expandedTripId === trip.id;
                  const passengers = passengersByTripId[trip.id];
                  const loadingP = loadingPassengers[trip.id];
                  return (
                    <div
                      key={trip.id}
                      className="border rounded-xl bg-white shadow-sm overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTrip(trip.id)}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{trip.route_name || 'Route'}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(trip.trip_date)} · {formatTime(trip.start_time)} · {trip.direction}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {isExpanded ? 'Hide passengers' : 'View passengers'}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="border-t bg-gray-50/80 px-4 py-4">
                          {loadingP ? (
                            <p className="text-sm text-gray-500">Loading passengers...</p>
                          ) : Array.isArray(passengers) && passengers.length === 0 ? (
                            <p className="text-sm text-gray-500">No passengers on this trip.</p>
                          ) : Array.isArray(passengers) ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-600 border-b">
                                    <th className="pb-2 pr-4 font-medium">Name</th>
                                    <th className="pb-2 pr-4 font-medium">Email</th>
                                    <th className="pb-2 pr-4 font-medium">Type</th>
                                    <th className="pb-2 font-medium">Pickup stop</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {passengers.map((p) => (
                                    <tr key={p.user_id} className="border-b border-gray-100 last:border-0">
                                      <td className="py-2 pr-4 font-medium text-gray-900">{p.full_name}</td>
                                      <td className="py-2 pr-4 text-gray-600">{p.email || '—'}</td>
                                      <td className="py-2 pr-4">
                                        <SeatTypeBadge type={p.seat_type} />
                                      </td>
                                      <td className="py-2 text-gray-600">{p.pickup_stop_name}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-red-600">Failed to load passengers.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
