import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, User, Bus, Users, Clock, History, XCircle, MapPin, Calendar, FileText } from 'lucide-react';

import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getSubscription } from '../../services/auth';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import DashboardLayout from './DashboardLayout';

export default function TOSubscriberDashboard() {
  const navigate = useNavigate();

  const [subscriptionDetails, setSubscriptionDetails] = React.useState(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  
  // TO specific navigation
  const handleSubscriptionRequests = () => navigate('/subscription-requests');

  // Subscriber specific actions
  const handleTakeLeave = () =>
    window.alert('Take leave for one or multiple days, releasing reserved seats');
  const handleChangePickup = () => window.alert('Change pickup location for the current day');
  
  // Token actions
  const handleBuyToken = () => window.alert('Buy token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => navigate('/token-history');

  const handleSubscriptionDetails = async () => {
    if (detailsLoading) {
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      window.alert('You must be logged in to view subscription details');
      return;
    }
    setDetailsLoading(true);
    try {
      const subscription = await getSubscription(token);
      setSubscriptionDetails(subscription);
      setDetailsOpen(true);
    } catch {
      window.alert('Unable to load subscription details');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <WelcomeBanner />

          {/* Request Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Requests</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ActionCard
                    icon={FileText}
                    label="Subscription requests"
                    description="Review and manage pending subscription requests."
                    iconClassName="text-primary-600"
                    onClick={handleSubscriptionRequests}
                />
            </div>
          </div>

          {/* Subscription Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ActionCard
                icon={Ticket}
                label="Take leave"
                description="Release reserved seats for specific days."
                iconClassName="text-primary-600"
                onClick={handleTakeLeave}
                />

                <ActionCard
                icon={Ticket}
                label="Change pickup"
                description="Update your pickup location."
                iconClassName="text-primary-600"
                onClick={handleChangePickup}
                />

                <ActionCard
                icon={User}
                label="Subscription details"
                description="View your current plan and status."
                iconClassName="text-primary-600"
                onClick={handleSubscriptionDetails}
                />
            </div>
          </div>

          {/* Token Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Token</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
      </section>

      <SubscriptionDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        subscription={subscriptionDetails}
        loading={detailsLoading}
      />
    </DashboardLayout>
  );
}
