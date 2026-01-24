import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/auth-context';
import DashboardLayout from './dashboard/DashboardLayout';
import TokenHistory from './TokenHistory';
import Transition from '../components/ui/Transition';

export default function TokenHistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fullName =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('full_name') || localStorage.getItem('name'))) ||
    user?.full_name ||
    user?.name ||
    'User';

  const userEmail = user?.email || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <DashboardLayout fullName={fullName} userEmail={userEmail} onLogout={handleLogout}>
      <Transition
        open
        enterClassName="opacity-100 translate-y-0"
        exitClassName="opacity-0 translate-y-4"
      >
        <section className="px-4 py-6 md:px-8 md:py-8">
          <div className="w-full max-w-6xl">
            <TokenHistory onBack={() => navigate('/dashboard')} />
          </div>
        </section>
      </Transition>
    </DashboardLayout>
  );
}
