import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Ticket, Users } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { getTripsAvailability } from '../services/auth';
import DashboardLayout from './dashboard/DashboardLayout';

export default function SeatAvailabilityPage() {
  const navigate = useNavigate();

  const [trips, setTrips] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadAvailability = React.useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      window.alert('You must be logged in to view seat availability');
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getTripsAvailability(token);
      setTrips(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to load seat availability');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  React.useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const routes = React.useMemo(() => {
    const grouped = trips.reduce((acc, trip) => {
      const key = trip.route_name || 'Unknown route';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(trip);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, routeTrips]) => ({
        name,
        trips: routeTrips.sort((a, b) => {
          const dateCompare = String(a.trip_date).localeCompare(String(b.trip_date));
          if (dateCompare !== 0) return dateCompare;
          return String(a.start_time).localeCompare(String(b.start_time));
        }),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [trips]);

  const totalCapacity = trips.reduce((sum, trip) => sum + trip.total_capacity, 0);
  const totalBooked = trips.reduce((sum, trip) => sum + trip.booked_seats, 0);
  const totalAvailable = trips.reduce((sum, trip) => sum + trip.available_seats, 0);

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
                <span className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Seat availability</h1>
                <p className="text-sm text-gray-600">
                  Snapshot of trips, capacity, and seat allocations for today.
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={loadAvailability} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={Users}
              label="Available seats"
              value={totalAvailable}
              helper="Across active trips"
            />
            <StatCard
              icon={Ticket}
              label="Booked seats"
              value={totalBooked}
              helper="Allocated for students"
            />
            <StatCard
              icon={Bus}
              label="Total capacity"
              value={totalCapacity}
              helper="Fleet for today"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {routes.length === 0 && !loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-600">
                No trips available for today.
              </div>
            ) : (
              routes.map((route) => (
                <Card key={route.name} className="border-primary-100">
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-900">{route.name}</CardTitle>
                      <p className="text-sm text-gray-600">Trips assigned to this route</p>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {route.trips.length} trips
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b">
                            <th className="py-3 pr-4 font-medium">Date</th>
                            <th className="py-3 pr-4 font-medium">Time</th>
                            <th className="py-3 pr-4 font-medium">Status</th>
                            <th className="py-3 pr-4 font-medium">Vehicle</th>
                            <th className="py-3 pr-4 font-medium">Capacity</th>
                            <th className="py-3 pr-4 font-medium">Available</th>
                            <th className="py-3 pr-4 font-medium">Driver</th>
                          </tr>
                        </thead>
                        <tbody>
                          {route.trips.map((trip) => (
                            <tr key={trip.id} className="border-b last:border-none text-gray-700">
                              <td className="py-3 pr-4">{trip.trip_date}</td>
                              <td className="py-3 pr-4">{trip.start_time}</td>
                              <td className="py-3 pr-4">
                                <span
                                  className={[
                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                                    trip.status === 'STARTED'
                                      ? 'bg-green-100 text-green-700'
                                      : trip.status === 'COMPLETED'
                                      ? 'bg-gray-200 text-gray-700'
                                      : 'bg-primary-50 text-primary-700',
                                  ].join(' ')}
                                >
                                  {trip.status}
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-semibold text-gray-900">
                                {trip.vehicle_number}
                              </td>
                              <td className="py-3 pr-4">{trip.total_capacity}</td>
                              <td className="py-3 pr-4 font-semibold text-gray-900">
                                {trip.available_seats}
                              </td>
                              <td className="py-3 pr-4">{trip.driver_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
