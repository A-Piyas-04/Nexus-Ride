import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/ui/Button';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { ActionCard } from '../../components/ui/ActionCard';
import { Bus, Users, CalendarDays } from 'lucide-react';
import { getMyDriverProfile } from '../../services/auth';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);

  const navLinks = [
    { name: 'Overview', targetId: 'driver-dashboard-overview' },
    { name: 'Actions', targetId: 'driver-dashboard-actions' },
  ];

  useEffect(() => {
    const fetchStatus = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getMyDriverProfile(token);
        setStatus(profile?.driver_status || 0);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    let intervalId;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const checkApproval = async () => {
      if (!token) return;
      try {
        const profile = await getMyDriverProfile(token);
        const s = profile?.driver_status || 0;
        setStatus(s);
        if (s === 1 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch {}
    };
    if (status !== 1) {
      intervalId = window.setInterval(checkApproval, 5000);
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkApproval();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [status]);

  const disabled = status !== 1;

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <div className="pl-4 md:pl-32">
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <div id="driver-dashboard-overview" className="scroll-mt-24">
            <WelcomeBanner>
              {disabled && !loading ? (
                <div className="inline-block" title="Approval pending">
                  <Button disabled>Pending Approval</Button>
                </div>
              ) : null}
            </WelcomeBanner>
          </div>

          <div id="driver-dashboard-actions" className="scroll-mt-24">
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Driver actions</h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                    <ActionCard
                      icon={Bus}
                      label="SEE ASSIGNED VEHICLES"
                      description="View vehicles assigned to you."
                      iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                      onClick={() => window.alert('Assigned vehicles')}
                      disabled={disabled}
                      title={disabled ? 'Pending approval' : ''}
                    />
                    <ActionCard
                      icon={Users}
                      label="SEE PASSENGER LIST"
                      description="See passengers on your upcoming trips."
                      iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                      onClick={() => window.alert('Passenger list')}
                      disabled={disabled}
                      title={disabled ? 'Pending approval' : ''}
                    />
                    <ActionCard
                      icon={CalendarDays}
                      label="TAKE LEAVE"
                      description="Request leave for specific days."
                      iconClassName={disabled ? 'text-gray-400' : 'text-primary-600'}
                      onClick={() => window.alert('Take leave')}
                      disabled={disabled}
                      title={disabled ? 'Pending approval' : ''}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>
      </section>
      </div>
    </DashboardLayout>
  );
}
