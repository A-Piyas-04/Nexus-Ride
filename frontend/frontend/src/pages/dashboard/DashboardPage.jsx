import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Ticket, XCircle, User, Briefcase } from 'lucide-react';
import axios from 'axios';

import { Button } from '../../components/ui/Button';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SubscriptionModal from '../../modals/SubscriptionModal';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import { createSubscription, getSubscription } from '../../services/auth';
import { Navbar } from '../../components/Navbar';
import DashboardLayout from './DashboardLayout';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userEmail } = useCurrentUser();
  const [userRoles, setUserRoles] = useState([]); // Store all user roles
  
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const navLinks = [
    { name: 'Overview', targetId: 'dashboard-welcome' },
    { name: 'Subscription', targetId: 'dashboard-subscription' },
    { name: 'Services', targetId: 'dashboard-services' },
  ];

  // Redirect Transport Officer to their specific dashboard
  useEffect(() => {
    if (userEmail === 'transportofficer@iut-dhaka.edu') {
      navigate('/to-dashboard');
    }
  }, [userEmail, navigate]);

  // Fetch user role and subscription status
  useEffect(() => {
    if (userEmail === 'transportofficer@iut-dhaka.edu') return; 

    const fetchDashboardData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          // Fetch user details to get role
          const meResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/me`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Dashboard: User data fetched:', meResponse.data);

          if (meResponse.data.roles && Array.isArray(meResponse.data.roles)) {
             setUserRoles(meResponse.data.roles);
          } else {
             // Fallback if roles not present or empty
             setUserRoles([]);
          }

          const sub = await getSubscription(token).catch(() => null);
          if (sub) {
            setSubscriptionStatus(sub.status);
            setSubscriptionDetails(sub);
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
      }
    };
    fetchDashboardData();
  }, [navigate, userEmail]);

  const handleSeatAvailability = () => navigate('/seat-availability');
  const handleBuyToken = () => navigate('/buy-token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => navigate('/token-history');
  
  const handleOpenSubscribe = () => setSubscribeOpen(true);
  const handleCloseSubscribe = () => setSubscribeOpen(false);

  // const handleFacultyRequest = () => navigate('/dashboard/transport-requests/my');
  const handleGuestRequest = () => navigate('/dashboard/transport-requests/new');     

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
      
      // Refresh status without redirecting
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
  const isFaculty = userRoles.some(r => r.name === 'FACULTY');

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <div id="dashboard-welcome" className="scroll-mt-24">
            <WelcomeBanner>
              <div className="inline-block mr-2">
                <Button 
                  onClick={handleGuestRequest} 
                  disabled={!isFaculty}
                  className={`${isFaculty ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                  title={isFaculty ? "Request transport for guests" : "Available only for Faculty members"}
                >
                  Guest Request
                </Button>
              </div>
              {subscriptionStatus !== 'ACTIVE' && (
                  <div className="inline-block" title={subscriptionStatus === 'PENDING' ? "Subscription request pending" : ""}>
                  <Button onClick={handleOpenSubscribe} disabled={subscriptionStatus === 'PENDING'}>
                      {subscriptionStatus === 'PENDING' ? 'Pending Approval' : 'Subscribe'}
                  </Button>
                  </div>
              )}
            </WelcomeBanner>
          </div>

          {/* Subscription Section */}
          <div id="dashboard-subscription" className="scroll-mt-24">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
              <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
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
            </div>
          </div>

          {/* Faculty Section - Only visible to FACULTY role */}


          {/* Token & Other Services Section */}
          <div id="dashboard-services" className="scroll-mt-24">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">Services</h2>
              <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
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
