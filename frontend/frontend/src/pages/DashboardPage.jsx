import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  LogOut,
  Menu,
  Settings,
  Ticket,
  User,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import TokenHistory from './TokenHistory';

const DASHBOARD_VIEWS = {
  DASHBOARD: 'dashboard',
  TOKEN_HISTORY: 'token-history',
};

function DashboardActionCard({ icon: Icon, label, iconClassName, onClick }) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="w-full h-28 md:h-32 rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md hover:border-primary-200 transition-all px-6"
    >
      <div className="w-full flex items-center justify-center gap-3">
        <Icon className={`h-5 w-5 ${iconClassName}`} />
        <span className="font-semibold">{label}</span>
      </div>
    </Button>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [view, setView] = React.useState(DASHBOARD_VIEWS.DASHBOARD);

  const fullName =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('full_name') || localStorage.getItem('name'))) ||
    user?.full_name ||
    user?.name ||
    'User';

  const userEmail = user?.email || '';

  // Username for welcome (omit everything after '@')
  const welcomeName = userEmail ? userEmail.split('@')[0] : fullName;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Do not change logic/functionality
  const handleSeatAvailability = () => window.alert('Seat availability');
  const handleBuyToken = () => window.alert('Buy token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => setView(DASHBOARD_VIEWS.TOKEN_HISTORY);

  const handleCloseSidebar = () => setSidebarOpen(false);
  const handleOpenSidebar = () => setSidebarOpen(true);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white md:hidden">
          <Button variant="ghost" onClick={handleOpenSidebar} aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="text-sm text-gray-700 font-medium truncate max-w-[70%]">
            {fullName}
          </div>
        </div>

        {view === DASHBOARD_VIEWS.DASHBOARD && (
          <section className="w-full px-4 py-8 md:px-8 md:py-10">
            <div className="w-full max-w-6xl">
              {/* Darker green header section (ALL 3 lines inside) */}
              <div className="rounded-2xl border border-green-200 bg-green-100 px-6 py-6 shadow-sm">
                {/* <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Dashboard
                </h1> */}

                <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Welcome, <span className="font-extrabold">{welcomeName}</span>
                </p>

                <p className="mt-1 text-sm md:text-base text-green-900/80 font-medium">
                  Logged in as <span className="font-semibold">{userEmail}</span>
                </p>
              </div>

              {/* Options */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <DashboardActionCard
                  icon={Ticket}
                  label="Seat Availability"
                  iconClassName="text-primary-600"
                  onClick={handleSeatAvailability}
                />

                <DashboardActionCard
                  icon={Ticket}
                  label="Buy Token"
                  iconClassName="text-primary-600"
                  onClick={handleBuyToken}
                />

                <DashboardActionCard
                  icon={XCircle}
                  label="Cancel Token"
                  iconClassName="text-red-600"
                  onClick={handleCancelToken}
                />

                <DashboardActionCard
                  icon={History}
                  label="Token History"
                  iconClassName="text-primary-600"
                  onClick={handleTokenHistory}
                />
              </div>
            </div>
          </section>
        )}

        {view === DASHBOARD_VIEWS.TOKEN_HISTORY && (
          <section className="px-4 py-6 md:px-8 md:py-8">
            <div className="w-full max-w-6xl">
              <TokenHistory onBack={() => setView(DASHBOARD_VIEWS.DASHBOARD)} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
