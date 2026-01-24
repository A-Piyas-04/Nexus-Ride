import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Ticket, Users } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { SEAT_AVAILABILITY_SECTIONS } from '../constants/routes';
import DashboardLayout from './dashboard/DashboardLayout';

export default function SeatAvailabilityPage() {
  const navigate = useNavigate();

  const allTrips = SEAT_AVAILABILITY_SECTIONS.flatMap((section) =>
    section.routes.flatMap((route) => route.vehicles.flatMap((vehicle) => vehicle.trips))
  );

  const totalCapacity = allTrips.reduce((sum, trip) => sum + trip.total_capacity, 0);
  const totalBooked = allTrips.reduce((sum, trip) => sum + trip.booked_seats, 0);
  const totalAvailable = allTrips.reduce((sum, trip) => sum + trip.available_seats, 0);

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
    </DashboardLayout>
  );
}
