import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/Button';
import axios from 'axios';

export default function DriverTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem('token');

  const fetchTrips = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/drivers/my-trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        // Sort trips: future/today first, then past
        // Actually backend might already sort, but let's ensure we see all of them.
        // The current endpoint returns all trips for the driver.
        setTrips(res.data);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error("Failed to fetch trips", error);
      setTrips([]);
    } finally {
        setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

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

  return (
    <DashboardLayout>
      <Navbar links={[]} />
      <div className="pl-4 md:pl-32">
        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">All Assigned Trips</h1>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                Back
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading trips...</div>
            ) : trips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No trips found.</div>
            ) : (
                <div className="space-y-4">
                    {trips.map(trip => (
                    <div key={trip.id} className="border rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-lg">{trip.route_name}</p>
                            <p className="text-gray-600">{trip.trip_date} | {trip.start_time}</p>
                            <p className="text-sm text-gray-500">Direction: {trip.direction}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Status: <span className={`font-medium ${
                                    trip.status === 'COMPLETED' ? 'text-green-600' :
                                    trip.status === 'STARTED' ? 'text-blue-600' :
                                    'text-gray-600'
                                }`}>{trip.status}</span>
                            </p>
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
