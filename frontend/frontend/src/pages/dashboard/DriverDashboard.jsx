import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Users, CalendarDays } from 'lucide-react';
import axios from 'axios';

import DashboardLayout from './DashboardLayout';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/Button';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { ActionCard } from '../../components/ui/ActionCard';
import { getMyDriverProfile } from '../../services/auth';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  
  const token = localStorage.getItem('token');

  const navLinks = [
    { name: 'Overview', targetId: 'driver-dashboard-overview' },
    { name: 'Trips', targetId: 'driver-dashboard-trips' },
    { name: 'Actions', targetId: 'driver-dashboard-actions' },
  ];

  // Fetch Status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getMyDriverProfile(token);
        setStatus(profile?.driver_status || 0);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [token]);

  // Poll for approval if not active
  useEffect(() => {
    let intervalId;
    const checkApproval = async () => {
      if (!token) return;
      try {
        const profile = await getMyDriverProfile(token);
        const s = profile?.driver_status || 0;
        setStatus(s);
        if (s === 1 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (error) {
        console.error('Failed to check approval status:', error);
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

  // Fetch Trips
  const fetchTrips = useCallback(async () => {
    if (!token) return;
    try {
      // Use the correct endpoint /api/drivers/my-trips
      const res = await axios.get('/api/drivers/my-trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setTrips(res.data);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error("Failed to fetch trips", error);
      setTrips([]);
    }
  }, [token]);

  // Load trips when status is active (1)
  useEffect(() => {
    if (status === 1) {
        const load = async () => {
            await fetchTrips();
        };
        load();
    }
  }, [status, fetchTrips]);

  const handleStart = async (id) => {
    try {
        await axios.patch(`/api/trips/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
        });
        fetchTrips();
    } catch (err) {
        alert(err.response?.data?.detail || "Failed to start trip");
    }
  };

  const handleComplete = async (id) => {
    try {
        await axios.patch(`/api/trips/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
        });
        fetchTrips();
    } catch (err) {
        alert(err.response?.data?.detail || "Failed to complete trip");
    }
  };

  const disabled = status !== 1;

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <div className="pl-4 md:pl-32">
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          
          {/* Overview Section */}
          <div id="driver-dashboard-overview" className="scroll-mt-24">
            <WelcomeBanner>
              {disabled && !loading ? (
                <div className="inline-block" title="Approval pending">
                  <Button disabled>Pending Approval</Button>
                </div>
              ) : null}
            </WelcomeBanner>
          </div>

          {/* Trips Section (Only if approved) */}
          {!disabled && (
            <div id="driver-dashboard-trips" className="scroll-mt-24">
                <div className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-900">Today's Trips</h2>
                    <div className="space-y-4">
                        {trips.length === 0 ? (
                            <p className="text-gray-500">No trips assigned for today.</p>
                        ) : (
                            trips.map(trip => (
                            <div key={trip.id} className="border rounded-xl p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-lg">{trip.route_name}</p>
                                    <p className="text-gray-600">{trip.trip_date} | {trip.start_time}</p>
                                    <p className="text-sm text-gray-500">Direction: {trip.direction}</p>
                                </div>

                                <div className="space-x-2">
                                    {trip.status === 'SCHEDULED' && (
                                    <Button onClick={() => handleStart(trip.id)}>
                                        Start
                                    </Button>
                                    )}

                                    {trip.status === 'STARTED' && (
                                    <Button onClick={() => handleComplete(trip.id)} variant="secondary">
                                        Complete
                                    </Button>
                                    )}

                                    {trip.status === 'COMPLETED' && (
                                    <span className="text-green-600 font-semibold px-3 py-1 bg-green-50 rounded-full">
                                        Completed
                                    </span>
                                    )}
                                </div>
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* Actions Section */}
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
                      onClick={() => window.alert('Assigned vehicles')}
                      disabled={disabled}
                      title={disabled ? 'Pending approval' : ''}
                    />
                    <ActionCard
                      icon={Users}
                      label="SEE PASSENGER LIST"
                      description="See passengers on your upcoming trips."
                      iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                      onClick={() => window.alert('Passenger list')}
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
    </DashboardLayout>
  );
}
