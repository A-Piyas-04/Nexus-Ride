import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Calendar, Clock, History, MapPin, Ticket, Users, XCircle } from 'lucide-react';

import { useAuth } from '../../context/auth-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import SubscriptionModal from '../../modals/SubscriptionModal';
import { createSubscription } from '../../services/auth';
import DashboardLayout from './DashboardLayout';

const DASHBOARD_SUMMARY = {
  tripsAvailable: 3,
  seatsRemaining: 21,
  totalCapacity: 96,
  nextDeparture: '07:30 AM',
  nextRoute: 'Campus ↔ Uttara',
};

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
      className="w-full min-h-[130px] md:min-h-[160px] rounded-xl border-2 border-primary-300 bg-white text-gray-900 shadow-md hover:shadow-lg hover:border-primary-400 transition-all px-6 py-6"
    >
      <div className="w-full flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          {React.createElement(Icon, { className: `h-6 w-6 ${iconClassName}` })}
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-lg md:text-xl">{label}</p>
          <p className="text-sm md:text-base text-gray-500">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>
    </Button>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleSeatAvailability = () => navigate('/seat-availability');
  const handleBuyToken = () => window.alert('Buy token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => navigate('/token-history');
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

  return (
    <DashboardLayout fullName={fullName} userEmail={userEmail} onLogout={handleLogout}>
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
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={Bus}
              label="Trips available"
              value={DASHBOARD_SUMMARY.tripsAvailable}
              helper="Scheduled for today"
            />
            <StatCard
              icon={Users}
              label="Seats remaining"
              value={DASHBOARD_SUMMARY.seatsRemaining}
              helper={`${DASHBOARD_SUMMARY.totalCapacity} total capacity`}
            />
            <StatCard
              icon={Clock}
              label="Next departure"
              value={DASHBOARD_SUMMARY.nextDeparture}
              helper={DASHBOARD_SUMMARY.nextRoute}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
    </DashboardLayout>
  );
}
