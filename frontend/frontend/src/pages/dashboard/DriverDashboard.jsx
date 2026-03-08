import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Users, CalendarDays } from 'lucide-react';

import DashboardLayout from './DashboardLayout';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/Button';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { ActionCard } from '../../components/ui/ActionCard';
import { getMyDriverProfile, getMyTrips, startTrip, completeTrip } from '../../services/auth';
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

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

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
                                  <Button onClick={() => handleStart(trip)} disabled={actionId !== null}>
                                    Start
                                  </Button>
                                )}
                                {trip.status === 'STARTED' && (
                                  <Button variant="secondary" onClick={() => handleComplete(trip)} disabled={actionId !== null}>
                                    Complete
                                  </Button>
                                )}
                                {trip.status === 'COMPLETED' && (
                                  <span className="text-green-600 font-semibold px-3 py-1 bg-green-50 rounded-full">Completed</span>
                                )}
                              </div>
                            </div>
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
                      <ActionCard
                        icon={CalendarDays}
                        label="TAKE LEAVE"
                        description="Request leave for specific days."
                        iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                        onClick={() => window.alert('Take leave')}
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


