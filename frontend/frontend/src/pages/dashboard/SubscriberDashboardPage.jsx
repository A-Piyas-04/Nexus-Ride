import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, User } from 'lucide-react';

import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { getSubscription } from '../../services/auth';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import DashboardLayout from './DashboardLayout';

export default function SubscriberDashboardPage() {
  const navigate = useNavigate();

  const [checkingAccess, setCheckingAccess] = React.useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = React.useState(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      navigate('/login');
      return;
    }

    const checkAccess = async () => {
      try {
        const subscription = await getSubscription(token);
        setSubscriptionDetails(subscription);
        if (!subscription || !['PENDING', 'ACTIVE'].includes(subscription.status)) {
          navigate('/dashboard');
          return;
        }
      } catch {
        navigate('/dashboard');
        return;
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [navigate]);

  const handleTakeLeave = () =>
    window.alert('Take leave for one or multiple days, releasing reserved seats');
  const handleChangeRoute = () => window.alert('Change route for the current day');
  const handleChangePickup = () => window.alert('Change pickup location for the current day');
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

  if (checkingAccess) {
    return null;
  }

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl">
          <WelcomeBanner />

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            <ActionCard
              icon={Ticket}
              label="Take leave"
              description="Release reserved seats for specific days."
              iconClassName="text-primary-600"
              onClick={handleTakeLeave}
            />

            <ActionCard
              icon={Ticket}
              label="Change route"
              description="Modify your route for today."
              iconClassName="text-primary-600"
              onClick={handleChangeRoute}
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
