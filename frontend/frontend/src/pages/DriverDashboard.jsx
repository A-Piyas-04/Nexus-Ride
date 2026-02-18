import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './dashboard/DashboardLayout';
import { Button } from '../components/ui/Button';
import { WelcomeBanner } from '../components/ui/WelcomeBanner';
import { ActionCard } from '../components/ui/ActionCard';
import { Bus, Users, CalendarDays } from 'lucide-react';
import { getMyDriverProfile } from '../services/auth';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const disabled = status !== 1;

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <WelcomeBanner>
            {disabled && !loading ? (
              <div className="inline-block" title="Approval pending">
                <Button disabled>Pending Approval</Button>
              </div>
            ) : null}
          </WelcomeBanner>

          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
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
          )}

          <div>
            <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
