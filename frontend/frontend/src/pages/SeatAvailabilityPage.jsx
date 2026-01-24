import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Ticket, Users } from 'lucide-react';

import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import DashboardLayout from './dashboard/DashboardLayout';

const SEAT_AVAILABILITY_ROWS = [
  {
    id: 'TRP-1021',
    route_name: 'Campus ↔ Uttara',
    vehicle_number: 'NR-208',
    trip_date: '2026-01-24',
    start_time: '07:30',
    status: 'SCHEDULED',
    total_capacity: 32,
    booked_seats: 24,
    available_seats: 8,
  },
  {
    id: 'TRP-1045',
    route_name: 'Campus ↔ Mirpur',
    vehicle_number: 'NR-331',
    trip_date: '2026-01-24',
    start_time: '08:15',
    status: 'BOARDING',
    total_capacity: 28,
    booked_seats: 21,
    available_seats: 7,
  },
  {
    id: 'TRP-1110',
    route_name: 'Campus ↔ Gazipur',
    vehicle_number: 'NR-514',
    trip_date: '2026-01-24',
    start_time: '09:05',
    status: 'SCHEDULED',
    total_capacity: 36,
    booked_seats: 30,
    available_seats: 6,
  },
];

const SEAT_ALLOCATION_PREVIEW = [
  {
    id: 'SA-0001',
    trip_id: 'TRP-1021',
    user_id: 'USR-8E12',
    seat_type: 'REGULAR',
    pickup_stop_id: 'STOP-UTT-01',
  },
  {
    id: 'SA-0002',
    trip_id: 'TRP-1045',
    user_id: 'USR-19C4',
    seat_type: 'PRIORITY',
    pickup_stop_id: 'STOP-MIR-03',
  },
  {
    id: 'SA-0003',
    trip_id: 'TRP-1110',
    user_id: 'USR-2B77',
    seat_type: 'REGULAR',
    pickup_stop_id: 'STOP-GAZ-02',
  },
];

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {helper && <p className="text-xs text-gray-500">{helper}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50">
          {React.createElement(Icon, { className: 'h-5 w-5 text-primary-600' })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SeatAvailabilityPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fullName =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('full_name') || localStorage.getItem('name'))) ||
    user?.full_name ||
    user?.name ||
    'User';

  const userEmail = user?.email || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalCapacity = SEAT_AVAILABILITY_ROWS.reduce((sum, trip) => sum + trip.total_capacity, 0);
  const totalBooked = SEAT_AVAILABILITY_ROWS.reduce((sum, trip) => sum + trip.booked_seats, 0);
  const totalAvailable = SEAT_AVAILABILITY_ROWS.reduce((sum, trip) => sum + trip.available_seats, 0);

  return (
    <DashboardLayout fullName={fullName} userEmail={userEmail} onLogout={handleLogout}>
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
            <Button variant="secondary">Refresh</Button>
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

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">Trip availability</CardTitle>
                <p className="text-sm text-gray-600">Based on TripAvailabilityRead schema.</p>
              </div>
              <Button variant="secondary" size="sm">
                Export
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-3 pr-4 font-medium">Trip ID</th>
                      <th className="py-3 pr-4 font-medium">Route</th>
                      <th className="py-3 pr-4 font-medium">Vehicle</th>
                      <th className="py-3 pr-4 font-medium">Date</th>
                      <th className="py-3 pr-4 font-medium">Time</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 pr-4 font-medium">Capacity</th>
                      <th className="py-3 pr-4 font-medium">Booked</th>
                      <th className="py-3 pr-4 font-medium">Available</th>
                      <th className="py-3 pr-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SEAT_AVAILABILITY_ROWS.map((trip) => (
                      <tr key={trip.id} className="border-b last:border-none text-gray-700">
                        <td className="py-3 pr-4 font-semibold text-gray-900">{trip.id}</td>
                        <td className="py-3 pr-4">{trip.route_name}</td>
                        <td className="py-3 pr-4">{trip.vehicle_number}</td>
                        <td className="py-3 pr-4">{trip.trip_date}</td>
                        <td className="py-3 pr-4">{trip.start_time}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={[
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                              trip.status === 'BOARDING'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-primary-50 text-primary-700',
                            ].join(' ')}
                          >
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{trip.total_capacity}</td>
                        <td className="py-3 pr-4">{trip.booked_seats}</td>
                        <td className="py-3 pr-4 font-semibold text-gray-900">
                          {trip.available_seats}
                        </td>
                        <td className="py-3 pr-4">
                          <Button variant="secondary" size="sm">
                            Reserve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Seat allocation preview</CardTitle>
              <p className="text-sm text-gray-600">
                Based on SeatAllocationRead schema for recent allocations.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-3 pr-4 font-medium">ID</th>
                      <th className="py-3 pr-4 font-medium">Trip ID</th>
                      <th className="py-3 pr-4 font-medium">User ID</th>
                      <th className="py-3 pr-4 font-medium">Seat type</th>
                      <th className="py-3 pr-4 font-medium">Pickup stop ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SEAT_ALLOCATION_PREVIEW.map((allocation) => (
                      <tr key={allocation.id} className="border-b last:border-none text-gray-700">
                        <td className="py-3 pr-4 font-semibold text-gray-900">
                          {allocation.id}
                        </td>
                        <td className="py-3 pr-4">{allocation.trip_id}</td>
                        <td className="py-3 pr-4">{allocation.user_id}</td>
                        <td className="py-3 pr-4">{allocation.seat_type}</td>
                        <td className="py-3 pr-4">{allocation.pickup_stop_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardLayout>
  );
}
