import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Calendar, History, MapPin, Ticket, XCircle } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SubscriptionModal from '../../modals/SubscriptionModal';
import { createSubscription, getSubscription } from '../../services/auth';
import DashboardLayout from './DashboardLayout';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userEmail } = useCurrentUser();
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // Redirect Transport Officer to their specific dashboard
  React.useEffect(() => {
    if (userEmail === 'transportofficer@iut-dhaka.edu') {
      navigate('/to-dashboard');
    }
  }, [userEmail, navigate]);

  // Fetch subscription status and redirect if active
  React.useEffect(() => {
    if (userEmail === 'transportofficer@iut-dhaka.edu') return; // Skip for TO, handled by first effect

    const fetchSubscription = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          const sub = await getSubscription(token);
          if (sub) {
            setSubscriptionStatus(sub.status);
            if (sub.status === 'ACTIVE') {
              navigate('/subscriber');
            }
          }
        } catch (error) {
          // Ignore 404s or other errors, user might not have a subscription
        }
      }
    };
    fetchSubscription();
  }, [navigate, userEmail]);

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
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <WelcomeBanner>
            <div className="inline-block" title={subscriptionStatus === 'PENDING' ? "Subscription request pending" : ""}>
              <Button onClick={handleOpenSubscribe} disabled={subscriptionStatus === 'PENDING'}>
                Subscribe
              </Button>
            </div>
          </WelcomeBanner>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
