import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, User, Bus, Users, Clock, History, XCircle, MapPin, Calendar } from 'lucide-react';

import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getSubscription, getTripsAvailability } from '../../services/auth';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import DashboardLayout from './DashboardLayout';

export default function SubscriberDashboardPage() {
  const navigate = useNavigate();

  const [checkingAccess, setCheckingAccess] = React.useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = React.useState(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [dashboardSummary, setDashboardSummary] = React.useState({
    tripsAvailable: 0,
    seatsRemaining: 0,
    totalCapacity: 0,
    nextDeparture: '--:--',
    nextRoute: 'No upcoming trips',
    nextDate: '--',
    nextVehicle: '--',
    nextPickup: 'Your Stop'
  });

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [subscription, trips] = await Promise.all([
          getSubscription(token),
          getTripsAvailability(token)
        ]);

        setSubscriptionDetails(subscription);
        if (!subscription || subscription.status !== 'ACTIVE') {
          navigate('/dashboard');
          return;
        }

        // Process trips data
        const tripsArray = Array.isArray(trips) ? trips : [];
        const today = new Date().toISOString().split('T')[0];
        const todaysTrips = tripsArray.filter(trip => trip.trip_date === today);
        
        const nextTrip = tripsArray[0]; 
        
        setDashboardSummary({
          tripsAvailable: todaysTrips.length,
          seatsRemaining: todaysTrips.reduce((acc, trip) => acc + (trip.available_seats || 0), 0),
          totalCapacity: todaysTrips.reduce((acc, trip) => acc + (trip.total_capacity || 0), 0),
          nextDeparture: nextTrip ? nextTrip.start_time.slice(0, 5) : '--:--',
          nextRoute: nextTrip ? nextTrip.route_name : 'No upcoming trips',
          nextDate: nextTrip ? new Date(nextTrip.trip_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--',
          nextVehicle: nextTrip ? `${nextTrip.vehicle_number} · ${nextTrip.total_capacity} seats` : '--',
          nextPickup: subscription?.pickup_point || 'Your Stop'
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (!subscriptionDetails) navigate('/dashboard'); 
      } finally {
        setCheckingAccess(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleTakeLeave = () =>
    window.alert('Take leave for one or multiple days, releasing reserved seats');
  const handleChangeRoute = () => window.alert('Change route for the current day');
  const handleChangePickup = () => window.alert('Change pickup location for the current day');
  const handleSeatAvailability = () => navigate('/seat-availability');
  const handleBuyToken = () => window.alert('Buy token');
  const handleCancelToken = () => window.alert('Cancel token');
  const handleTokenHistory = () => navigate('/token-history');

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
        <div className="w-full max-w-6xl space-y-8">
          <WelcomeBanner />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={Bus}
              label="Trips available"
              value={dashboardSummary.tripsAvailable}
              helper="Scheduled for today"
            />
            <StatCard
              icon={Users}
              label="Seats remaining"
              value={dashboardSummary.seatsRemaining}
              helper={`${dashboardSummary.totalCapacity} total capacity`}
            />
            <StatCard
              icon={Clock}
              label="Next departure"
              value={dashboardSummary.nextDeparture}
              helper={dashboardSummary.nextRoute}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

          <Card className="border-gray-200">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-lg text-gray-900">Today’s highlights</CardTitle>
              <p className="text-sm text-gray-600">
                Quick glance at routes and stops for the next departures.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Date</p>
                  <p className="text-sm text-gray-600">{dashboardSummary.nextDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Primary pickup</p>
                  <p className="text-sm text-gray-600">{dashboardSummary.nextPickup}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bus className="mt-0.5 h-4 w-4 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Vehicle</p>
                  <p className="text-sm text-gray-600">{dashboardSummary.nextVehicle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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