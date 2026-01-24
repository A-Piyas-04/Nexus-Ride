import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bus,
  Calendar,
  Clock,
  History,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Ticket,
  User,
  Users,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../context/auth-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import SubscriptionModal from '../../modals/SubscriptionModal';
import TokenHistory from '../TokenHistory';
import { createSubscription } from '../../services/auth';

const DASHBOARD_VIEWS = {
  DASHBOARD: 'dashboard',
  TOKEN_HISTORY: 'token-history',
  SEAT_AVAILABILITY: 'seat-availability',
};

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

function SectionTransition({ children }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={[
        'transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

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

function DashboardActionCard({ icon: Icon, label, description, iconClassName, onClick }) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="w-full rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md hover:border-primary-200 transition-all px-5 py-5"
    >
      <div className="w-full flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50">
          {React.createElement(Icon, { className: `h-5 w-5 ${iconClassName}` })}
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-base">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </Button>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [view, setView] = React.useState(DASHBOARD_VIEWS.DASHBOARD);
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);

  const fullName =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('full_name') || localStorage.getItem('name'))) ||
    user?.full_name ||
    user?.name ||
    'User';

  const userEmail = user?.email || '';

  const welcomeName = userEmail ? userEmail.split('@')[0] : fullName;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSeatAvailability = () => setView(DASHBOARD_VIEWS.SEAT_AVAILABILITY);
  const handleBuyToken = () => window.alert('Buy token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => setView(DASHBOARD_VIEWS.TOKEN_HISTORY);
  const handleBackToDashboard = () => setView(DASHBOARD_VIEWS.DASHBOARD);

  const handleCloseSidebar = () => setSidebarOpen(false);
  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleOpenSubscribe = () => setSubscribeOpen(true);
  const handleCloseSubscribe = () => setSubscribeOpen(false);

  const handleSubscribe = async ({ startMonth, endMonth, year, stopName }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      window.alert('You must be logged in to subscribe');
      return;
    }

    try {
      await createSubscription(
        {
          start_month: startMonth,
          end_month: endMonth,
          year: Number(year),
          stop_name: stopName,
        },
        token
      );
      setSubscribeOpen(false);
      navigate('/subscriber');
    } catch (error) {
      const message = error.response?.data?.detail || 'Subscription failed';
      window.alert(message);
    }
  };

  const totalCapacity = SEAT_AVAILABILITY_ROWS.reduce((sum, trip) => sum + trip.total_capacity, 0);
  const totalBooked = SEAT_AVAILABILITY_ROWS.reduce((sum, trip) => sum + trip.booked_seats, 0);
  const totalAvailable = SEAT_AVAILABILITY_ROWS.reduce((sum, trip) => sum + trip.available_seats, 0);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex">
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r shadow-sm p-4',
          'transform transition-transform duration-200 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:block',
        ].join(' ')}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-primary-900">NexusRide</div>

          <Button
            className="md:hidden"
            variant="ghost"
            onClick={handleCloseSidebar}
            aria-label="Close sidebar"
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Signed in as</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
        </div>

        <nav className="space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          <Button variant="secondary" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white md:hidden">
          <Button variant="ghost" onClick={handleOpenSidebar} aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="text-sm text-gray-700 font-medium truncate max-w-[70%]">{fullName}</div>
        </div>

        {view === DASHBOARD_VIEWS.DASHBOARD && (
          <SectionTransition>
            <section className="w-full px-4 py-8 md:px-8 md:py-10">
              <div className="w-full max-w-6xl space-y-8">
                <div className="rounded-2xl border border-green-200 bg-green-100 px-6 py-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Welcome back, <span className="font-extrabold">{welcomeName}</span>
                      </p>
                      <p className="mt-2 text-sm md:text-base text-green-900/80 font-medium">
                        Logged in as <span className="font-semibold">{userEmail}</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Manage your daily commute, tokens, and seat availability in one place.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={handleOpenSubscribe}>Subscribe</Button>
                      <Button variant="secondary" onClick={handleSeatAvailability}>
                        View seats
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <StatCard
                    icon={Bus}
                    label="Trips available"
                    value={SEAT_AVAILABILITY_ROWS.length}
                    helper="Scheduled for today"
                  />
                  <StatCard
                    icon={Users}
                    label="Seats remaining"
                    value={totalAvailable}
                    helper={`${totalCapacity} total capacity`}
                  />
                  <StatCard
                    icon={Clock}
                    label="Next departure"
                    value="07:30 AM"
                    helper="Campus ↔ Uttara"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <DashboardActionCard
                    icon={Ticket}
                    label="Seat availability"
                    description="Review today’s trips, capacity, and available seats."
                    iconClassName="text-primary-600"
                    onClick={handleSeatAvailability}
                  />

                  <DashboardActionCard
                    icon={Ticket}
                    label="Buy token"
                    description="Purchase a token for a one-time ride."
                    iconClassName="text-primary-600"
                    onClick={handleBuyToken}
                  />

                  <DashboardActionCard
                    icon={XCircle}
                    label="Cancel token"
                    description="Cancel an existing token and free the seat."
                    iconClassName="text-red-600"
                    onClick={handleCancelToken}
                  />

                  <DashboardActionCard
                    icon={History}
                    label="Token history"
                    description="Track recent purchases, cancellations, and usage."
                    iconClassName="text-primary-600"
                    onClick={handleTokenHistory}
                  />
                </div>

                <Card className="border-gray-200">
                  <CardHeader className="flex flex-col gap-1">
                    <CardTitle className="text-lg text-gray-900">Today’s highlights</CardTitle>
                    <p className="text-sm text-gray-600">
                      Quick glance at routes and stops for the next departures.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 text-primary-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Date</p>
                        <p className="text-sm text-gray-600">24 Jan 2026</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-primary-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Primary pickup</p>
                        <p className="text-sm text-gray-600">Uttara Sector 10</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Bus className="mt-0.5 h-4 w-4 text-primary-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Vehicle</p>
                        <p className="text-sm text-gray-600">NR-208 · 32 seats</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <SubscriptionModal
                open={subscribeOpen}
                onClose={handleCloseSubscribe}
                onSubmit={handleSubscribe}
              />
            </section>
          </SectionTransition>
        )}

        {view === DASHBOARD_VIEWS.TOKEN_HISTORY && (
          <SectionTransition>
            <section className="px-4 py-6 md:px-8 md:py-8">
              <div className="w-full max-w-6xl">
                <TokenHistory onBack={handleBackToDashboard} />
              </div>
            </section>
          </SectionTransition>
        )}

        {view === DASHBOARD_VIEWS.SEAT_AVAILABILITY && (
          <SectionTransition>
            <section className="w-full px-4 py-8 md:px-8 md:py-10">
              <div className="w-full max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" size="sm" onClick={handleBackToDashboard}>
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
          </SectionTransition>
        )}
      </main>
    </div>
  );
}
