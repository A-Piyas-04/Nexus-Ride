import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Settings, Ticket, User, XCircle } from 'lucide-react';

import { useAuth } from '../../context/auth-context';
import { Button } from '../../components/ui/Button';
import { getSubscription } from '../../services/auth';

const SUBSCRIBER_VIEWS = {
  DASHBOARD: 'dashboard',
  SUBSCRIPTION_DETAILS: 'subscription-details',
};

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
  const [view, setView] = React.useState(SUBSCRIBER_VIEWS.DASHBOARD);
  const [checkingAccess, setCheckingAccess] = React.useState(true);

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      navigate('/login');
      return;
    }

    const checkAccess = async () => {
      try {
        const subscription = await getSubscription(token);
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
  const handleSubscriptionDetails = () => setView(SUBSCRIBER_VIEWS.SUBSCRIPTION_DETAILS);

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

        {view === SUBSCRIBER_VIEWS.DASHBOARD && (
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
        )}

        {view === SUBSCRIBER_VIEWS.SUBSCRIPTION_DETAILS && (
          <section className="px-4 py-6 md:px-8 md:py-8">
            <div className="w-full max-w-6xl">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription details</h1>
                    <p className="text-gray-600 mt-1">Overview of your current subscription</p>
                  </div>
                  <Button variant="secondary" onClick={() => setView(SUBSCRIBER_VIEWS.DASHBOARD)}>
                    Back
                  </Button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Plan</div>
                    <div className="mt-1 font-semibold text-gray-900">Monthly Subscriber</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="mt-1 font-semibold text-gray-900">Active</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Route</div>
                    <div className="mt-1 font-semibold text-gray-900">Route A</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Pickup location</div>
                    <div className="mt-1 font-semibold text-gray-900">Main Street Stop</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
