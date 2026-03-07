import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { Button } from '../../components/ui/Button';
import { getMyTrips, startTrip, completeTrip } from '../../services/auth';

function formatDate(str) {
  if (!str) return '—';
  return String(str).slice(0, 10);
}

function formatTime(str) {
  if (!str) return '—';
  const s = String(str);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export default function DriverAllTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchTrips = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await getMyTrips(token);
      setTrips(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load trips.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleStart = async (trip) => {
    if (!token || actionId) return;
    setActionId(trip.id);
    try {
      await startTrip(trip.id, token);
      await fetchTrips();
    } catch {
      setError('Failed to start trip.');
    } finally {
      setActionId(null);
    }
  };

  const handleComplete = async (trip) => {
    if (!token || actionId) return;
    setActionId(trip.id);
    try {
      await completeTrip(trip.id, token);
      await fetchTrips();
    } catch {
      setError('Failed to complete trip.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="pl-4 md:pl-32">
        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="max-w-6xl space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900">All my assigned trips</h1>
              <Button variant="secondary" onClick={() => navigate('/driver-dashboard')}>Back to dashboard</Button>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : trips.length === 0 ? (
              <p className="text-gray-600">No upcoming trips assigned to you.</p>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <div key={trip.id} className="border rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{trip.route_name || 'Route'}</p>
                        <p className="text-sm text-gray-600">{formatDate(trip.trip_date)} · {formatTime(trip.start_time)} · {trip.direction}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {trip.status === 'SCHEDULED' && (
                          <Button onClick={() => handleStart(trip)} disabled={actionId !== null}>Start</Button>
                        )}
                        {trip.status === 'STARTED' && (
                          <Button variant="secondary" onClick={() => handleComplete(trip)} disabled={actionId !== null}>Complete</Button>
                        )}
                        {trip.status === 'COMPLETED' && (
                          <span className="text-green-600 font-semibold">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
