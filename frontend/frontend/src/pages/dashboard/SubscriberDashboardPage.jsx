import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Settings, Ticket, User, XCircle } from 'lucide-react';

import { useAuth } from '../../context/auth-context';
import { Button } from '../../components/ui/Button';
import { getSubscription } from '../../services/auth';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';

function DashboardActionCard({ icon: Icon, label, iconClassName, onClick }) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="w-full h-28 md:h-32 rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md hover:border-primary-200 transition-all px-6"
    >
      <div className="w-full flex items-center justify-center gap-3">
        {React.createElement(Icon, { className: `h-5 w-5 ${iconClassName}` })}
        <span className="font-semibold text-center text-base md:text-lg">{label}</span>
      </div>
    </Button>
  );
}

export default function SubscriberDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
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

  const handleCloseSidebar = () => setSidebarOpen(false);
  const handleOpenSidebar = () => setSidebarOpen(true);

  if (checkingAccess) {
    return null;
  }

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

        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-6xl">
            <div className="rounded-2xl border border-green-200 bg-green-100 px-6 py-6 shadow-sm">
              <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                Welcome, <span className="font-extrabold">{welcomeName}</span>
              </p>

              <p className="mt-1 text-sm md:text-base text-green-900/80 font-medium">
                Logged in as <span className="font-semibold">{userEmail}</span>
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              <DashboardActionCard
                icon={Ticket}
                label="Take leave"
                iconClassName="text-primary-600"
                onClick={handleTakeLeave}
              />

              <DashboardActionCard
                icon={Ticket}
                label="Change route"
                iconClassName="text-primary-600"
                onClick={handleChangeRoute}
              />

              <DashboardActionCard
                icon={Ticket}
                label="Change pickup"
                iconClassName="text-primary-600"
                onClick={handleChangePickup}
              />

              <DashboardActionCard
                icon={User}
                label="Subscription details"
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
      </main>
    </div>
  );
}
