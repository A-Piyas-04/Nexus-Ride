import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Users } from 'lucide-react';

import DashboardLayout from './DashboardLayout';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/Button';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { ActionCard } from '../../components/ui/ActionCard';
import {
  getMyDriverProfile,
  getMyTrips,
  startTrip,
  completeTrip,
  getRouteStops,
  getTripProgress,
  markStopArrived,
  markStopDeparted,
} from '../../services/auth';
import AssignedVehiclesModal from '../../modals/assigned_vehicles';

function formatDate(str) {
  if (!str) return '—';
  return String(str).slice(0, 10);
}

function formatTime(str) {
  if (!str) return '—';
  const s = String(str);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function isBeforeScheduledTime(trip) {
  const dateStr = String(trip.trip_date || '').slice(0, 10);
  const timeStr = String(trip.start_time || '').slice(0, 5);
  if (!dateStr || !timeStr) return false;
  const scheduled = new Date(dateStr + 'T' + timeStr + ':00');
  return Date.now() < scheduled.getTime();
}

function allStopsDeparted(stops, progressList) {
  if (!stops || stops.length === 0) return false;
  return stops.every((stop) => {
    const p = progressList.find((x) => String(x.route_stop_id) === String(stop.id));
    return p && p.departed_at;
  });
}

function canMarkArrived(stopIndex, stops, progressList) {
  if (stopIndex === 0) return true;
  const prevStop = stops[stopIndex - 1];
  const prevP = progressList.find((x) => String(x.route_stop_id) === String(prevStop.id));
  return Boolean(prevP && prevP.departed_at);
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [stopsByRouteId, setStopsByRouteId] = useState({});
  const [progressByTripId, setProgressByTripId] = useState({});
  const [stopsLoadingTripId, setStopsLoadingTripId] = useState(null);
  const [stopActionKey, setStopActionKey] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [openAssigned, setOpenAssigned] = useState(false);
  
  const navLinks = [
    { name: 'Overview', targetId: 'driver-dashboard-overview' },
    { name: 'Trips', targetId: 'driver-dashboard-trips' },
    { name: 'Actions', targetId: 'driver-dashboard-actions' },
  ];

  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getMyDriverProfile(token);
        setStatus(Number(profile?.driver_status || 0));
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [token]);

  useEffect(() => {
    let intervalId;
    const checkApproval = async () => {
      if (!token) return;
      try {
        const profile = await getMyDriverProfile(token);
        const s = Number(profile?.driver_status || 0);
        setStatus(s);
        if (s === 1 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        console.error('Failed to check approval status:', err);
      }
    };
    if (status !== 1) {
      intervalId = window.setInterval(checkApproval, 5000);
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkApproval();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [status, token]);

  const fetchTrips = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const data = await getMyTrips(token);
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch trips', err);
      setTrips([]);
      setError('Failed to load your trips.');
    }
  }, [token]);

  // Poll for approval if not active
  useEffect(() => {
    if (status === 1) fetchTrips();
  }, [status, fetchTrips]);

  const handleStart = async (trip) => {
    if (!token || actionId) return;
    setActionId(trip.id);
    try {
      await startTrip(trip.id, token);
      await fetchTrips();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start trip.');
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
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete trip.');
    } finally {
      setActionId(null);
    }
  };

  const loadStopsAndProgress = useCallback(async (trip) => {
    if (!token) return;
    setStopsLoadingTripId(trip.id);
    setError('');
    try {
      if (!stopsByRouteId[trip.route_id]) {
        const stops = await getRouteStops(trip.route_id, token);
        setStopsByRouteId((prev) => ({ ...prev, [trip.route_id]: Array.isArray(stops) ? stops : [] }));
      }
      const progress = await getTripProgress(trip.id, token);
      setProgressByTripId((prev) => ({ ...prev, [trip.id]: Array.isArray(progress) ? progress : [] }));
    } catch (err) {
      console.error('Failed to load stops/progress', err);
      setError(err.response?.data?.detail || 'Failed to load stops.');
    } finally {
      setStopsLoadingTripId(null);
    }
  }, [stopsByRouteId, token]);

  const toggleStops = async (trip) => {
    if (expandedTripId === trip.id) {
      setExpandedTripId(null);
      return;
    }
    setExpandedTripId(trip.id);
    await loadStopsAndProgress(trip);
  };

  const handleArrived = async (trip, stop) => {
    if (!token || stopActionKey) return;
    setStopActionKey(`${trip.id}:${stop.id}:arrived`);
    setError('');
    try {
      await markStopArrived(trip.id, stop.id, token);
      const progress = await getTripProgress(trip.id, token);
      setProgressByTripId((prev) => ({ ...prev, [trip.id]: Array.isArray(progress) ? progress : [] }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark arrived.');
    } finally {
      setStopActionKey(null);
    }
  };

  const handleDeparted = async (trip, stop) => {
    if (!token || stopActionKey) return;
    setStopActionKey(`${trip.id}:${stop.id}:departed`);
    setError('');
    try {
      await markStopDeparted(trip.id, stop.id, token);
      const progress = await getTripProgress(trip.id, token);
      setProgressByTripId((prev) => ({ ...prev, [trip.id]: Array.isArray(progress) ? progress : [] }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark departed.');
    } finally {
      setStopActionKey(null);
    }
  };

  const disabled = status != 1;

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <div className="pl-4 md:pl-32">
        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-6xl space-y-8">
            <div id="driver-dashboard-overview" className="scroll-mt-24">
              <WelcomeBanner>
                {disabled && !loading && (
                  <div className="inline-block" title="Approval pending">
                    <Button disabled>Pending Approval</Button>
                  </div>
                )}
              </WelcomeBanner>
            </div>

            <div id="driver-dashboard-trips" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">My Trips</h2>
                {disabled ? (
                  <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-6 text-center">
                    <p className="text-gray-600">Your assigned trips will appear here after your driver account is approved.</p>
                    <p className="text-sm text-gray-500 mt-1">You will be able to <strong>Start</strong> and <strong>Complete</strong> trips from this section.</p>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
                    )}
                    {trips.length === 0 ? (
                      <p className="text-gray-500">No trips assigned for today.</p>
                    ) : (
                      <div className="space-y-4">
                        {trips.map((trip) => (
                          <div key={trip.id} className="border rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex flex-wrap justify-between items-center gap-3">
                              <div>
                                <p className="font-semibold text-lg text-gray-900">{trip.route_name || 'Route'}</p>
                                <p className="text-gray-600">{formatDate(trip.trip_date)} | {formatTime(trip.start_time)}</p>
                                <p className="text-sm text-gray-500">Direction: {trip.direction}</p>
                              </div>
                              <div className="space-x-2">
                                {trip.status === 'SCHEDULED' && (
                                  <>
                                    <Button
                                      onClick={() => handleStart(trip)}
                                      disabled={actionId !== null || isBeforeScheduledTime(trip)}
                                      title={isBeforeScheduledTime(trip) ? `Available at ${formatDate(trip.trip_date)} ${formatTime(trip.start_time)}` : ''}
                                    >
                                      Start
                                    </Button>
                                    {isBeforeScheduledTime(trip) && (
                                      <span className="text-xs text-gray-500">Available at {formatTime(trip.start_time)}</span>
                                    )}
                                  </>
                                )}
                                {trip.status === 'STARTED' && (() => {
                                  const stops = stopsByRouteId[trip.route_id] || [];
                                  const progressList = progressByTripId[trip.id] || [];
                                  const allDeparted = allStopsDeparted(stops, progressList);
                                  return (
                                    <>
                                      <Button onClick={() => toggleStops(trip)} disabled={actionId !== null || stopsLoadingTripId === trip.id}>
                                        {expandedTripId === trip.id ? 'Hide stops' : 'Stops'}
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        onClick={() => handleComplete(trip)}
                                        disabled={actionId !== null || !allDeparted}
                                        title={!allDeparted ? 'Mark all stops departed to complete the trip' : ''}
                                      >
                                        Complete
                                      </Button>
                                      {!allDeparted && expandedTripId === trip.id && (
                                        <span className="text-xs text-amber-600">Mark all stops departed to complete the trip.</span>
                                      )}
                                    </>
                                  );
                                })()}
                                {trip.status === 'COMPLETED' && (
                                  <span className="text-green-600 font-semibold px-3 py-1 bg-green-50 rounded-full">Completed</span>
                                )}
                              </div>
                            </div>

                            {trip.status === 'STARTED' && expandedTripId === trip.id && (
                              <div className="mt-4 border-t pt-4">
                                {stopsLoadingTripId === trip.id ? (
                                  <div className="text-sm text-gray-600">Loading stops...</div>
                                ) : (
                                  <div className="space-y-2">
                                    {(stopsByRouteId[trip.route_id] || []).map((stop, stopIndex) => {
                                      const progressList = progressByTripId[trip.id] || [];
                                      const stops = stopsByRouteId[trip.route_id] || [];
                                      const p = progressList.find((x) => String(x.route_stop_id) === String(stop.id));
                                      const departed = Boolean(p?.departed_at);
                                      const arrived = Boolean(p?.arrived_at);
                                      const allowArrived = canMarkArrived(stopIndex, stops, progressList);

                                      return (
                                        <div key={stop.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                                          <div className="min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{stop.stop_name}</div>
                                            <div className="text-xs text-gray-500">
                                              {departed ? 'Departed' : arrived ? 'Arrived' : 'Upcoming'}
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            {!arrived && (
                                              <Button
                                                variant="secondary"
                                                onClick={() => handleArrived(trip, stop)}
                                                disabled={Boolean(stopActionKey) || !allowArrived}
                                                title={!allowArrived ? 'Mark the previous stop as departed first' : ''}
                                              >
                                                Mark arrived
                                              </Button>
                                            )}
                                            {arrived && !departed && (
                                              <Button
                                                variant="secondary"
                                                onClick={() => handleDeparted(trip, stop)}
                                                disabled={Boolean(stopActionKey)}
                                                title="Mark this stop as departed"
                                              >
                                                Mark departed
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {(stopsByRouteId[trip.route_id] || []).length === 0 && (
                                      <div className="text-sm text-gray-600">No stops configured for this route.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div id="driver-dashboard-actions" className="scroll-mt-24">
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-gray-900">Driver actions</h2>
                  <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                      <ActionCard
                        icon={Bus}
                        label="SEE ASSIGNED VEHICLES"
                        description="View vehicles assigned to you."
                        iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                        onClick={() => setOpenAssigned(true)}
                        disabled={disabled}
                        title={disabled ? 'Pending approval' : ''}
                      />
                      <ActionCard
                        icon={Bus}
                        label="VIEW ALL TRIPS"
                        description="See all your assigned trips history."
                        iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                        onClick={() => navigate('/driver/all-trips')}
                        disabled={disabled}
                        title={disabled ? 'Pending approval' : ''}
                      />
                      <ActionCard
                        icon={Users}
                        label="SEE PASSENGER LIST"
                        description="See passengers on your upcoming trips."
                        iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                        onClick={() => navigate('/driver/passenger-list')}
                        disabled={disabled}
                        title={disabled ? 'Pending approval' : ''}
                      />

                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Back
              </Button>
            </div>
          </div>
        </section>
      </div>
      <AssignedVehiclesModal open={openAssigned} onClose={() => setOpenAssigned(false)} />
    </DashboardLayout>
  );
}


