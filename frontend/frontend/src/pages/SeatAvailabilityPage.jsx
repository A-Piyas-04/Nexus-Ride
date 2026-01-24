import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Ticket, Users } from 'lucide-react';

import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Transition from '../components/ui/Transition';
import DashboardLayout from './dashboard/DashboardLayout';

const ROUTE_DEFINITIONS = [
  {
    id: 'route-1',
    route_name: 'Route-1',
    stops: [
      'Tongi Station Road',
      'Uttara Sector 7',
      'Airport',
      'Banani',
      'Mohakhali',
      'Farmgate',
    ],
  },
  {
    id: 'route-2',
    route_name: 'Route-2',
    stops: [
      'Abdullahpur',
      'Mirpur 10',
      'Agargaon',
      'Bijoy Sarani',
      'Shahbagh',
      'Motijheel',
    ],
  },
];

const ROUTE_VEHICLES = {
  'to-campus': {
    'route-1': [
      {
        id: 'veh-208',
        number: 'NR-208',
        driver: 'Shafiul Islam',
        trips: [
          {
            id: 'TRP-1021',
            trip_date: '2026-01-24',
            start_time: '07:30',
            status: 'BOARDING',
            total_capacity: 32,
            booked_seats: 24,
            available_seats: 8,
          },
          {
            id: 'TRP-1022',
            trip_date: '2026-01-24',
            start_time: '08:05',
            status: 'SCHEDULED',
            total_capacity: 32,
            booked_seats: 20,
            available_seats: 12,
          },
        ],
      },
    ],
    'route-2': [
      {
        id: 'veh-331',
        number: 'NR-331',
        driver: 'Imran Hossain',
        trips: [
          {
            id: 'TRP-1045',
            trip_date: '2026-01-24',
            start_time: '08:15',
            status: 'BOARDING',
            total_capacity: 28,
            booked_seats: 21,
            available_seats: 7,
          },
        ],
      },
    ],
  },
  'to-home': {
    'route-1': [
      {
        id: 'veh-219',
        number: 'NR-219',
        driver: 'Sabbir Ahmed',
        trips: [
          {
            id: 'TRP-1206',
            trip_date: '2026-01-24',
            start_time: '05:20',
            status: 'BOARDING',
            total_capacity: 30,
            booked_seats: 27,
            available_seats: 3,
          },
        ],
      },
    ],
    'route-2': [
      {
        id: 'veh-514',
        number: 'NR-514',
        driver: 'Nazia Rahman',
        trips: [
          {
            id: 'TRP-1110',
            trip_date: '2026-01-24',
            start_time: '04:45',
            status: 'SCHEDULED',
            total_capacity: 36,
            booked_seats: 30,
            available_seats: 6,
          },
          {
            id: 'TRP-1112',
            trip_date: '2026-01-24',
            start_time: '06:10',
            status: 'SCHEDULED',
            total_capacity: 36,
            booked_seats: 18,
            available_seats: 18,
          },
        ],
      },
    ],
  },
};

const SEAT_AVAILABILITY_SECTIONS = [
  {
    id: 'to-campus',
    title: 'Going to Campus',
    description: 'Based on RouteStop order for morning inbound routes.',
    routes: ROUTE_DEFINITIONS.map((route) => ({
      id: route.id,
      name: route.route_name,
      stops: route.stops,
      vehicles: ROUTE_VEHICLES['to-campus'][route.id] || [],
    })),
  },
  {
    id: 'to-home',
    title: 'Going Home',
    description: 'Return trips following RouteStop order in reverse.',
    routes: ROUTE_DEFINITIONS.map((route) => ({
      id: route.id,
      name: route.route_name,
      stops: [...route.stops].reverse(),
      vehicles: ROUTE_VEHICLES['to-home'][route.id] || [],
    })),
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

  const allTrips = SEAT_AVAILABILITY_SECTIONS.flatMap((section) =>
    section.routes.flatMap((route) => route.vehicles.flatMap((vehicle) => vehicle.trips))
  );

  const totalCapacity = allTrips.reduce((sum, trip) => sum + trip.total_capacity, 0);
  const totalBooked = allTrips.reduce((sum, trip) => sum + trip.booked_seats, 0);
  const totalAvailable = allTrips.reduce((sum, trip) => sum + trip.available_seats, 0);

  return (
    <DashboardLayout fullName={fullName} userEmail={userEmail} onLogout={handleLogout}>
      <Transition
        open
        enterClassName="opacity-100 translate-y-0"
        exitClassName="opacity-0 translate-y-4"
      >
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

            <div className="space-y-8">
              {SEAT_AVAILABILITY_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className="rounded-2xl border border-primary-100 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-primary-100 bg-primary-50 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                        Direction
                      </p>
                      <h2 className="text-2xl font-bold text-primary-900">{section.title}</h2>
                      <p className="text-sm text-primary-700/80">{section.description}</p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700">
                      {section.routes.length} routes
                    </div>
                  </div>
                  <div className="space-y-6 p-6">
                    {section.routes.map((route) => (
                      <Card key={route.id} className="border-primary-100">
                          <CardHeader className="flex flex-col gap-2">
                            <CardTitle className="text-lg text-gray-900">{route.name}</CardTitle>
                            <p className="text-sm text-gray-600">Stops in order</p>
                            <div className="flex flex-wrap gap-2">
                              {route.stops.map((stop, index) => (
                                <div
                                  key={`${route.id}-${stop}`}
                                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
                                >
                                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                                    {index + 1}
                                  </span>
                                  <span>{stop}</span>
                                </div>
                              ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-0">
                          {route.vehicles.map((vehicle) => (
                            <div
                              key={vehicle.id}
                              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-gray-500">
                                    Vehicle
                                  </p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {vehicle.number}
                                  </p>
                                  <p className="text-sm text-gray-600">Driver: {vehicle.driver}</p>
                                </div>
                                <div className="text-left md:text-right">
                                  <p className="text-xs uppercase tracking-wide text-gray-500">
                                    Trips
                                  </p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {vehicle.trips.length}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                      <th className="py-3 pr-4 font-medium">Trip ID</th>
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
                                    {vehicle.trips.map((trip) => (
                                      <tr key={trip.id} className="border-b last:border-none text-gray-700">
                                        <td className="py-3 pr-4 font-semibold text-gray-900">
                                          {trip.id}
                                        </td>
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
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Transition>
    </DashboardLayout>
  );
}
