import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, History, MapPin, Ticket, XCircle, FileText, User, CreditCard, AlertCircle, Navigation } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import SubscriptionModal from '../../modals/SubscriptionModal';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import { createSubscription, getSubscription } from '../../services/auth';
import { Navbar } from '../../components/Navbar';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/auth-context';

export default function TODashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const navLinks = [
    { name: 'Overview', targetId: 'to-welcome' },
    { name: 'Review', targetId: 'to-review' },
    { name: 'Manage', targetId: 'to-manage' },
    { name: 'Services', targetId: 'to-services' },
    { name: 'Subscription', targetId: 'to-subscription' },
    { name: 'Analytics', targetId: 'to-analytics' },
  ];

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          const sub = await getSubscription(token);
          if (sub) {
            setSubscriptionStatus(sub.status);
            setSubscriptionDetails(sub);
          }
        } catch {
          // Ignore 404s or other errors
        }
      }
    };
    fetchSubscription();
  }, [navigate]);

  const handleSeatAvailability = () => navigate('/seat-availability');
  const handleBuyToken = () => navigate('/buy-token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => navigate('/token-history');
  
  const handleOpenSubscribe = () => setSubscribeOpen(true);
  const handleCloseSubscribe = () => setSubscribeOpen(false);
  const handleSubscriptionRequests = () => navigate('/subscription-requests');
  const handleTransportRequests = () => navigate('/dashboard/transport-requests/manage');




  const handleNotifyUsers = () => window.alert('Notify users about important updates.');

  // Manage Handlers
  const isTO = user?.roles?.some(role => [1, 3].includes(role.id));

  const handleManageRoutes = () => {
    if (isTO) {
      navigate('/to-pages/to-add/routeAdd');
    } else {
      window.alert('Unauthorized: Only Transport Officers can manage routes.');
    }
  };
  const handleManageVehicles = () => window.alert('Manage Vehicles');
  const handleManageDrivers = () => window.alert('Manage Drivers');

  // Analytics Handlers
  const handleAnalyticsPayments = () => window.alert('Analytics Payments');
  const handleAnalyticsTokens = () => window.alert('Analytics Tokens');
  const handleAnalyticsIssues = () => window.alert('Analytics Issues');
  const handleAnalyticsTrips = () => window.alert('Analytics Trips');
  
  
  const checkSubscription = () => {
    if (subscriptionStatus !== 'ACTIVE') {
        window.alert('Subscribe to access these features.');
        return false;
    }
    return true;
  };

  const handleTakeLeave = () => {
      if (checkSubscription()) {
        window.alert('Take leave for one or multiple days, releasing reserved seats');
      }
  };
  const handleChangePickup = () => {
      if (checkSubscription()) {
        window.alert('Change pickup location for the current day');
      }
  };
  
  const handleSubscriptionDetails = async () => {
    if (!checkSubscription()) return;
    
    if (detailsLoading) return;
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const subscription = await getSubscription(token);
      setSubscriptionDetails(subscription);
      setDetailsOpen(true);
    } catch {
      window.alert('Unable to load subscription details');
    } finally {
      setDetailsLoading(false);
    }
  };

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
      // Refresh status
      const sub = await getSubscription(token);
      setSubscriptionStatus(sub.status);
      setSubscriptionDetails(sub);
      window.alert('Subscription request submitted successfully!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Subscription failed';
      window.alert(message);
    }
  };

  const isSubscribed = subscriptionStatus === 'ACTIVE';

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <div id="to-welcome" className="scroll-mt-24">
            <WelcomeBanner>
                {subscriptionStatus !== 'ACTIVE' && (
                    <div className="inline-block" title={subscriptionStatus === 'PENDING' ? "Subscription request pending" : ""}>
                    <Button onClick={handleOpenSubscribe} disabled={subscriptionStatus === 'PENDING'}>
                        {subscriptionStatus === 'PENDING' ? 'Pending Approval' : 'Subscribe'}
                    </Button>
                    </div>
                )}
            </WelcomeBanner>
          </div>
          
          <div id="to-review" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Notify</h2> 
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Requests Section - Specific to TO */}
                <ActionCard
                    icon={FileText}
                    label="Subscription requests"
                    description="Review and manage pending subscription requests."
                    iconClassName="text-primary-600"
                    onClick={handleSubscriptionRequests}
                />

                <ActionCard
                    icon={FileText}
                    label="Transport Requests"
                    description="Review and manage faculty transport requests."
                    iconClassName="text-primary-600"
                    onClick={handleTransportRequests}
                />

                <ActionCard
                    icon={FileText}
                    label="Notify Users"
                    description="Notify users about important updates."
                    iconClassName="text-primary-600"
                    onClick={handleNotifyUsers}
                />
            </div>
          </div>

          {/* Manage */}
          <div id="to-manage" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manage <span className="text-sm font-bold text-red-600">(Coming Soon)</span></h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {isTO && (
                  <ActionCard
                    icon={MapPin}
                    label="Routes"
                    description="Manage your routes and stops."
                    iconClassName="text-gray-400"
                    onClick={handleManageRoutes}
                  />
                )}

                <ActionCard
                icon={Bus}
                label="Vehicles"
                description="Manage your fleet of vehicles."
                iconClassName="text-gray-400"
                onClick={handleManageVehicles}
                />

                <ActionCard
                icon={User}
                label="Drivers"
                description="Manage your drivers."
                iconClassName="text-gray-400"
                onClick={handleManageDrivers}
                />
            </div>
          </div>

          {/* Token & Services Section */}
          <div id="to-services" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Token & Services</h2>
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
          </div>          


             {/* Subscription Section */}
          <div id="to-subscription" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ActionCard
                icon={Ticket}
                label="Take leave"
                description="Release reserved seats for specific days."
                iconClassName={isSubscribed ? "text-primary-600" : "text-gray-400"}
                onClick={handleTakeLeave}
                disabled={!isSubscribed}
                title={!isSubscribed ? "Subscribe first" : ""}
                />

                <ActionCard
                icon={Ticket}
                label="Change pickup"
                description="Update your pickup location."
                iconClassName={isSubscribed ? "text-primary-600" : "text-gray-400"}
                onClick={handleChangePickup}
                disabled={!isSubscribed}
                title={!isSubscribed ? "Subscribe first" : ""}
                />

                <ActionCard
                icon={User}
                label="Subscription details"
                description="View your current plan and status."
                iconClassName={isSubscribed ? "text-primary-600" : "text-gray-400"}
                onClick={handleSubscriptionDetails}
                disabled={!isSubscribed}
                title={!isSubscribed ? "Subscribe first" : ""}
                />
            </div>
          </div>


                    {/* Analytics Section */}
          <div id="to-analytics" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics <span className="text-sm font-bold text-red-600">(Coming Soon)</span></h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ActionCard
                icon={CreditCard}
                label="Payments"
                description="View payment history and reports."
                iconClassName="text-gray-400"
                onClick={handleAnalyticsPayments}
                />

                <ActionCard
                icon={Ticket}
                label="Tokens"
                description="Analyze token usage and sales."
                iconClassName="text-gray-400"
                onClick={handleAnalyticsTokens}
                />

                <ActionCard
                icon={AlertCircle}
                label="Issues"
                description="Track and resolve reported issues."
                iconClassName="text-gray-400"
                onClick={handleAnalyticsIssues}
                />

                <ActionCard
                icon={Navigation}
                label="Trips"
                description="Analyze trip performance and stats."
                iconClassName="text-gray-400"
                onClick={handleAnalyticsTrips}
                />
            </div>
          </div>


        </div>

        <SubscriptionModal
          open={subscribeOpen}
          onClose={handleCloseSubscribe}
          onSubmit={handleSubscribe}
        />
        
        <SubscriptionDetailsModal
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            subscription={subscriptionDetails}
            loading={detailsLoading}
        />
      </section>
    </DashboardLayout>
  );
}
