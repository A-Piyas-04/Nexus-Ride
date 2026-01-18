import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Menu, Ticket, XCircle, History, Settings, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TokenHistory from './TokenHistory';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [view, setView] = React.useState('dashboard');

  const displayName = (typeof window !== 'undefined' && (localStorage.getItem('full_name') || localStorage.getItem('name'))) || user?.full_name || user?.name || user?.email || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSeatAvailability = () => window.alert('Seat availability');
  const handleBuyToken = () => window.alert('Buy token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => setView('token-history');

  return (
    <div className="min-h-screen w-full bg-gray-100 flex">
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r shadow-sm p-4 transform transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:block`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-primary-900">NexusRide</div>
          <Button className="md:hidden" variant="ghost" onClick={() => setSidebarOpen(false)}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" /> Profile
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 md:ml-64">
        <div className="flex items-center justify-between p-4 md:hidden">
          <Button variant="ghost" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-sm text-gray-600">{displayName}</div>
        </div>

        {view === 'dashboard' && (
          <div className="px-4 py-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600">Welcome back, <span className="font-semibold">{displayName}</span></p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Button className="w-full h-28 text-lg justify-center" onClick={handleSeatAvailability}>
                <Ticket className="h-5 w-5 mr-2" /> Seat Availability
              </Button>
              <Button className="w-full h-28 text-lg justify-center" variant="secondary" onClick={handleBuyToken}>
                <Ticket className="h-5 w-5 mr-2" /> Buy Token
              </Button>
              <Button className="w-full h-28 text-lg justify-center" variant="secondary" onClick={handleCancelToken}>
                <XCircle className="h-5 w-5 mr-2" /> Cancel Token
              </Button>
              <Button className="w-full h-28 text-lg justify-center" variant="secondary" onClick={handleTokenHistory}>
                <History className="h-5 w-5 mr-2" /> Token History
              </Button>
            </div>
          </div>
        )}

        {view === 'token-history' && (
          <div className="px-4 py-6 md:p-8">
            <TokenHistory onBack={() => setView('dashboard')} />
          </div>
        )}
      </div>
    </div>
  );
}
