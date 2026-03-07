import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  History,
  MapPin,
  Ticket,
  XCircle,
  FileText,
  User,
  CreditCard,
  AlertCircle,
  Navigation,
  Calendar,
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import SubscriptionModal from '../../modals/SubscriptionModal';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import ScheduleTripModal from '../../modals/ScheduleTripModal';
import { createSubscription, getSubscription, createLeave, getMyLeaves, deleteLeave } from '../../services/auth';
import {
  createTrip,
  getRoutes,
  getAllVehicles,
  getAllDrivers,
} from '../../services/transport';
import { Navbar } from '../../components/Navbar';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/auth-context';

const MAX_LEAVE_DAYS = 120;

export default function TODashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [tripData, setTripData] = useState({
    vehicle_id: '',
    driver_profile_id: '',
    route_id: '',
    direction: 'FROM_IUT',
    trip_date: '',
    start_time: '07:30',
  });

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ from_date: '', to_date: '', reason: '' });
  const [leaveError, setLeaveError] = useState('');
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leaveSuccessView, setLeaveSuccessView] = useState(false);
  const [leaveSuccessPeriod, setLeaveSuccessPeriod] = useState(null);

  const navLinks = [
    { name: 'Overview', targetId: 'to-welcome' },
    { name: 'Review', targetId: 'to-review' },
    { name: 'Manage', targetId: 'to-manage' },
    { name: 'Services', targetId: 'to-services' },
    { name: 'Subscription', targetId: 'to-subscription' },
    { name: 'Analytics', targetId: 'to-analytics' },
  ];

  const isTO = user?.roles?.some((role) => [1, 3].includes(role.id));

  useEffect(() => {
    const fetchSubscription = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const sub = await getSubscription(token);
          if (sub) {
            setSubscriptionStatus(sub.status);
            setSubscriptionDetails(sub);
          }
        } catch {}
      }
    };
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (subscriptionStatus === 'ACTIVE') loadLeaves();
  }, [subscriptionStatus]);

  useEffect(() => {
    if (!scheduleOpen) return;
    const load = async () => {
      try {
        const [r, v, d] = await Promise.all([
          getRoutes(),
          getAllVehicles(),
          getAllDrivers(),
        ]);
        setRoutes(Array.isArray(r) ? r : []);
        setVehicles(Array.isArray(v) ? v : []);
        setDrivers((Array.isArray(d) ? d : []).filter((x) => x.driver_status === 1));
      } catch {}
    };
    load();
  }, [scheduleOpen]);

  const handleScheduleTrip = async () => {
    if (!tripData.route_id || !tripData.vehicle_id || !tripData.driver_profile_id || !tripData.trip_date || !tripData.start_time) {
      setScheduleError('Please fill route, vehicle, driver, date and time.');
      return;
    }
    setScheduleLoading(true);
    setScheduleError('');
    try {
      const startTime = String(tripData.start_time).length === 5 ? `${tripData.start_time}:00` : tripData.start_time;
      await createTrip({
        route_id: tripData.route_id,
        vehicle_id: tripData.vehicle_id,
        driver_profile_id: parseInt(tripData.driver_profile_id, 10),
        direction: tripData.direction,
        trip_date: tripData.trip_date,
        start_time: startTime,
      });
      setScheduleOpen(false);
      setTripData({ vehicle_id: '', driver_profile_id: '', route_id: '', direction: 'FROM_IUT', trip_date: '', start_time: '07:30' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setScheduleError(typeof detail === 'string' ? detail : JSON.stringify(detail || err.message));
    } finally {
      setScheduleLoading(false);
    }
  };

  const loadLeaves = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLeavesLoading(true);
    try {
      const data = await getMyLeaves(token);
      setLeaves(Array.isArray(data) ? data : []);
    } catch {
      setLeaves([]);
    } finally {
      setLeavesLoading(false);
    }
  };

  const todayStr = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const activeLeavePeriods = React.useMemo(
    () => (Array.isArray(leaves) ? leaves.filter((l) => (String(l.from_date).slice(0, 10) <= todayStr && String(l.to_date).slice(0, 10) >= todayStr)) : []),
    [leaves, todayStr]
  );
  const isOnLeave = activeLeavePeriods.length > 0;

  const formatLeaveDate = (d) => {
    if (!d) return '';
    const s = String(d).slice(0, 10);
    const [y, m, day] = s.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${Number(day)} ${months[Number(m) - 1]} ${y}`;
  };

  const handleTakeLeave = () => {
    if (subscriptionStatus !== 'ACTIVE') {
      window.alert('Subscribe to access this feature.');
      return;
    }
    if (isOnLeave) {
      window.alert('You are already on a leave.');
      return;
    }
    setLeaveSuccessView(false);
    setLeaveSuccessPeriod(null);
    setLeaveModalOpen(true);
    setLeaveError('');
    setLeaveForm({ from_date: '', to_date: '', reason: '' });
    loadLeaves();
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.from_date || !leaveForm.to_date) {
      setLeaveError('From date and to date are required.');
      return;
    }
    if (leaveForm.from_date > leaveForm.to_date) {
      setLeaveError('From date must be on or before to date.');
      return;
    }
    const from = new Date(leaveForm.from_date);
    const to = new Date(leaveForm.to_date);
    const days = Math.floor((to - from) / (24 * 60 * 60 * 1000)) + 1;
    if (days > MAX_LEAVE_DAYS) {
      setLeaveError(`Leave cannot exceed ${MAX_LEAVE_DAYS} days (4 months).`);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setLeaveSaving(true);
    setLeaveError('');
    try {
      await createLeave(
        { from_date: leaveForm.from_date, to_date: leaveForm.to_date, reason: leaveForm.reason || null },
        token
      );
      setLeaveSuccessPeriod({ from_date: leaveForm.from_date, to_date: leaveForm.to_date });
      setLeaveForm({ from_date: '', to_date: '', reason: '' });
      await loadLeaves();
      setLeaveSuccessView(true);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create leave';
      setLeaveError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await deleteLeave(leaveId, token);
      loadLeaves();
    } catch {
      window.alert('Failed to cancel leave');
    }
  };

  const checkSubscription = () => {
    if (subscriptionStatus !== 'ACTIVE') {
      window.alert('Subscribe to access these features.');
      return false;
    }
    return true;
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
    const token = localStorage.getItem('token');
    if (!token) {
      window.alert('You must be logged in to subscribe');
      return;
    }
    try {
      const created = await createSubscription(
        { start_month: startMonth, end_month: endMonth, year: Number(year), stop_name: stopName },
        token
      );
      setSubscribeOpen(false);
      const sub = await getSubscription(token);
      setSubscriptionStatus(sub?.status);
      setSubscriptionDetails(sub);
      window.alert('Subscription request submitted successfully!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Subscription failed';
      window.alert(message);
    }
  };

  const isSubscribed = subscriptionStatus === 'ACTIVE';

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <div className="pl-4 md:pl-32">
        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-6xl space-y-8">
            <div id="to-welcome" className="scroll-mt-24">
              <WelcomeBanner>
                {subscriptionStatus !== 'ACTIVE' && (
                  <div className="inline-block" title={subscriptionStatus === 'PENDING' ? 'Subscription request pending' : ''}>
                    <Button onClick={() => setSubscribeOpen(true)} disabled={subscriptionStatus === 'PENDING'}>
                      {subscriptionStatus === 'PENDING' ? 'Pending Approval' : 'Subscribe'}
                    </Button>
                  </div>
                )}
              </WelcomeBanner>
              {isSubscribed && isOnLeave && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm font-medium animate-in fade-in duration-300">
                  You are on leave for this period: {activeLeavePeriods.map((l) => `${formatLeaveDate(l.from_date)} – ${formatLeaveDate(l.to_date)}${l.reason ? ` (${l.reason})` : ''}`).join('; ')}.
                </div>
              )}
            </div>

            <div id="to-review" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Review & Notify</h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                    <ActionCard
                      icon={FileText}
                      label="Subscription requests"
                      description="Review and manage pending subscription requests."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/subscription-requests')}
                    />
                    <ActionCard
                      icon={FileText}
                      label="Transport Requests"
                      description="Review and manage faculty transport requests."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/dashboard/transport-requests/manage')}
                    />
                    <ActionCard
                      icon={FileText}
                      label="Driver Requests"
                      description="Review and manage driver requests."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/dashboard/driver-requests/manage')}
                    />
                    <ActionCard
                      icon={FileText}
                      label="Notify Users"
                      description="Notify users about important updates."
                      iconClassName="text-primary-600"
                      onClick={() => window.alert('Notify users about important updates.')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div id="to-manage" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Manage</h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                    {isTO && (
                      <ActionCard
                        icon={MapPin}
                        label="Routes"
                        description="Manage your routes and stops."
                        iconClassName="text-gray-400"
                        onClick={() => navigate('/to-pages/route-manage/routeList')}
                      />
                    )}
                    <ActionCard
                      icon={Bus}
                      label="Vehicles"
                      description="Manage your fleet of vehicles."
                      iconClassName="text-gray-400"
                      onClick={() => navigate('/to-pages/vehicle-manage/vehicleList')}
                    />
                    <ActionCard
                      icon={User}
                      label="Drivers"
                      description="Manage your drivers."
                      iconClassName="text-gray-400"
                      onClick={() => navigate('/to-pages/driver-manage/driverList')}
                    />
                    {isTO && (
                      <ActionCard
                        icon={Calendar}
                        label="Trip Templates"
                        description="Manage recurring schedule (daily trip generation)."
                        iconClassName="text-primary-600"
                        onClick={() => navigate('/to-pages/trip-templates/tripTemplateList')}
                      />
                    )}
                    {isTO && (
                      <ActionCard
                        icon={Calendar}
                        label="Schedule Trip"
                        description="Create a one-off trip manually."
                        iconClassName="text-gray-400"
                        onClick={() => setScheduleOpen(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div id="to-services" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Token & Services</h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                    <ActionCard
                      icon={Ticket}
                      label="Seat availability"
                      description="Review today's trips, capacity, and available seats."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/seat-availability')}
                    />
                    <ActionCard
                      icon={Ticket}
                      label="Buy token"
                      description="Purchase a token for a one-time ride."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/buy-token')}
                    />
                    <ActionCard
                      icon={XCircle}
                      label="Cancel token"
                      description="Cancel an existing token and free the seat."
                      iconClassName="text-red-600"
                      onClick={() => window.alert('Cancel token')}
                    />
                    <ActionCard
                      icon={History}
                      label="Token history"
                      description="Track recent purchases, cancellations, and usage."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/token-history')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div id="to-subscription" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                    <div className={isOnLeave ? 'opacity-70' : ''}>
                      <ActionCard
                        icon={Ticket}
                        label="Take leave"
                        description={isOnLeave ? 'You are on leave for the selected period.' : 'Release reserved seats for specific days.'}
                        iconClassName={isOnLeave ? 'text-gray-400' : isSubscribed ? 'text-primary-600' : 'text-gray-400'}
                        onClick={handleTakeLeave}
                        disabled={!isSubscribed}
                        title={!isSubscribed ? 'Subscribe first' : isOnLeave ? 'You are already on a leave' : ''}
                      />
                    </div>
                    <ActionCard
                      icon={Ticket}
                      label="Change pickup"
                      description="Update your pickup location."
                      iconClassName={isSubscribed ? 'text-primary-600' : 'text-gray-400'}
                      onClick={() => checkSubscription() && window.alert('Change pickup location for the current day')}
                      disabled={!isSubscribed}
                      title={!isSubscribed ? 'Subscribe first' : ''}
                    />
                    <ActionCard
                      icon={User}
                      label="Subscription details"
                      description="View your current plan and status."
                      iconClassName={isSubscribed ? 'text-primary-600' : 'text-gray-400'}
                      onClick={handleSubscriptionDetails}
                      disabled={!isSubscribed}
                      title={!isSubscribed ? 'Subscribe first' : ''}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div id="to-analytics" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Analytics <span className="text-sm font-bold text-red-600">(Coming Soon)</span></h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                    <ActionCard
                      icon={CreditCard}
                      label="Payments"
                      description="View payment history and reports."
                      iconClassName="text-gray-400"
                      onClick={() => window.alert('Analytics Payments')}
                    />
                    <ActionCard
                      icon={Ticket}
                      label="Tokens"
                      description="Analyze token usage and sales."
                      iconClassName="text-gray-400"
                      onClick={() => window.alert('Analytics Tokens')}
                    />
                    <ActionCard
                      icon={AlertCircle}
                      label="Issues"
                      description="Track and resolve reported issues."
                      iconClassName="text-gray-400"
                      onClick={() => window.alert('Analytics Issues')}
                    />
                    <ActionCard
                      icon={Navigation}
                      label="Trips"
                      description="Analyze trip performance and stats."
                      iconClassName="text-gray-400"
                      onClick={() => window.alert('Analytics Trips')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SubscriptionModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} onSubmit={handleSubscribe} />
          <SubscriptionDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} subscription={subscriptionDetails} loading={detailsLoading} />

          <ScheduleTripModal
            open={scheduleOpen}
            onClose={() => { setScheduleOpen(false); setScheduleError(''); }}
            onSubmit={handleScheduleTrip}
            data={tripData}
            onChange={setTripData}
            routes={routes}
            vehicles={vehicles}
            drivers={drivers}
            error={scheduleError}
            loading={scheduleLoading}
          />

          {leaveModalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className={`bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 ${leaveSuccessView ? 'animate-in zoom-in-95 duration-300' : ''}`}>
                {leaveSuccessView ? (
                  <div className="text-center py-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Leave confirmed</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Your leave has been recorded for{' '}
                      {leaveSuccessPeriod && `${formatLeaveDate(leaveSuccessPeriod.from_date)} – ${formatLeaveDate(leaveSuccessPeriod.to_date)}`}.
                    </p>
                    <p className="text-gray-500 text-xs mb-6">Your reserved seat will be released for others on those dates.</p>
                    <Button onClick={() => { setLeaveModalOpen(false); setLeaveSuccessView(false); setLeaveSuccessPeriod(null); }}>
                      Back to dashboard
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold mb-2">Take leave</h3>
                    <p className="text-sm text-gray-600 mb-4">Release your reserved seat for 1 day up to 4 months. Others can buy tokens for those dates.</p>
                    {leaveError && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{leaveError}</div>
                    )}
                    <form onSubmit={handleLeaveSubmit} className="space-y-3 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                        <input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                        <input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                        <input type="text" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="e.g. Vacation" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={leaveSaving}>{leaveSaving ? 'Adding...' : 'Add leave'}</Button>
                        <Button type="button" variant="secondary" onClick={() => setLeaveModalOpen(false)}>Close</Button>
                      </div>
                    </form>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Your leave periods</h4>
                    {leavesLoading ? <p className="text-sm text-gray-500">Loading...</p> : leaves.length === 0 ? <p className="text-sm text-gray-500">No leave periods added yet.</p> : (
                      <ul className="space-y-2">
                        {leaves.map((leave) => (
                          <li key={leave.id} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            <span>{String(leave.from_date).slice(0, 10)} – {String(leave.to_date).slice(0, 10)}{leave.reason ? ` (${leave.reason})` : ''}</span>
                            <button type="button" onClick={() => handleDeleteLeave(leave.id)} className="text-red-600 hover:underline">Cancel</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
