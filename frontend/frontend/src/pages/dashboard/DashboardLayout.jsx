import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Settings, User, XCircle } from 'lucide-react';

import { useAuth } from '../../context/auth-context';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { fullName, userEmail } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleCloseSidebar = () => setSidebarOpen(false);
  const handleOpenSidebar = () => setSidebarOpen(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r shadow-sm p-4 transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
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

        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Signed in as</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
        </div>

        <nav className="space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/profile')}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>

          <Button variant="secondary" className="w-full justify-start" onClick={handleLogout}>
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

        {children}
      </main>
    </div>
  );
}
