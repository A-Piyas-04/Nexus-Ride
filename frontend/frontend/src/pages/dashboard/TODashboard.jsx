import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Calendar, Clock, History, MapPin, Ticket, Users, XCircle, FileText } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
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

export default function TODashboard() {
  const navigate = useNavigate();
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);

  const handleSeatAvailability = () => navigate('/seat-availability');
  const handleBuyToken = () => window.alert('Buy token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => navigate('/token-history');
  const handleOpenSubscribe = () => setSubscribeOpen(true);
  const handleCloseSubscribe = () => setSubscribeOpen(false);
  const handleSubscriptionRequests = () => navigate('/subscription-requests');

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
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <WelcomeBanner>
            <Button onClick={handleOpenSubscribe}>Subscribe</Button>
          </WelcomeBanner>

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
            <ActionCard
                icon={FileText}
                label="Subscription requests"
                description="Review and manage pending subscription requests."
                iconClassName="text-primary-600"
                onClick={handleSubscriptionRequests}
            />

            <ActionCard
              icon={Ticket}
              label="Seat availability"
              description="Review today’s trips, capacity, and available seats."
              iconClassName="text-primary-600"
              onClick={handleSeatAvailability}
            />

            <ActionCard
              icon={Ticket}
              label="Buy token"
              description="Purchase a token for a one-time ride."
              iconClassName="text-primary-600"
              onClick={handleBuyToken}
            />

            <ActionCard
              icon={XCircle}
              label="Cancel token"
              description="Cancel an existing token and free the seat."
              iconClassName="text-red-600"
              onClick={handleCancelToken}
            />

            <ActionCard
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
