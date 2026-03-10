import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  History,
  MapPin,
  Ticket,
  XCircle,
  FileText,
  User,
  Calendar,
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import SubscriptionModal from '../../modals/SubscriptionModal';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import ScheduleTripModal from '../../modals/ScheduleTripModal';
import { createSubscription, getSubscription, createLeave, getMyLeaves, deleteLeave, getSubscriptionRequests, getDriverRequests, getTripTracking } from '../../services/auth';
import {
  createTrip,
  getRoutes,
  getAllVehicles,
  getAllDrivers,
  getAllTransportRequests,
} from '../../services/transport';
import { getRidershipOverTime, getRidershipByRoute, getRevenueOverTime } from '../../services/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Navbar } from '../../components/Navbar';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/auth-context';

const MAX_LEAVE_DAYS = 120;

function normalizeIsoToUtc(s) {
  if (!s) return s;
  const str = String(s);
  if (/[zZ]$/.test(str) || /[+-]\d{2}:\d{2}$/.test(str)) return str;
  return `${str}Z`;
}

function timeAgo(isoString, nowMs) {
  if (!isoString) return '—';
  const ts = new Date(normalizeIsoToUtc(isoString)).getTime();
  if (Number.isNaN(ts)) return '—';
  const diffMs = Math.max(0, nowMs - ts);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return '1 hour ago';
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatTimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(normalizeIsoToUtc(isoString));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

  const [tracking, setTracking] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Counts for Review & Notify section
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [transportRequestCount, setTransportRequestCount] = useState(0);
  const [driverRequestCount, setDriverRequestCount] = useState(0);

  // Analytics
  const [ridershipOverTime, setRidershipOverTime] = useState([]);
  const [ridershipByRoute, setRidershipByRoute] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const navLinks = [
    { name: 'Overview', targetId: 'to-welcome' },
    { name: 'Tracking', targetId: 'to-tracking' },
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
        } catch {
          setSubscriptionStatus(null);
          setSubscriptionDetails(null);
        }
      }
    };
    fetchSubscription();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [subReqs, transReqs, drvReqs] = await Promise.all([
          getSubscriptionRequests(token),
          getAllTransportRequests('PENDING'),
          getDriverRequests(token),
        ]);
        setSubscriptionCount(Array.isArray(subReqs) ? subReqs.length : 0);
        setTransportRequestCount(Array.isArray(transReqs) ? transReqs.length : 0);
        setDriverRequestCount(Array.isArray(drvReqs) ? drvReqs.length : 0);
      } catch (error) {
        console.error('Failed to fetch dashboard counts:', error);
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      try {
        const [overTime, byRoute, revenue] = await Promise.all([
          getRidershipOverTime(14),
          getRidershipByRoute(30),
          getRevenueOverTime(14),
        ]);
        setRidershipOverTime(Array.isArray(overTime) ? overTime : []);
        setRidershipByRoute(Array.isArray(byRoute) ? byRoute : []);
        setRevenueOverTime(Array.isArray(revenue) ? revenue : []);
      } catch (err) {
        setAnalyticsError(err.response?.data?.detail || err.message || 'Failed to load analytics');
        setRidershipOverTime([]);
        setRidershipByRoute([]);
        setRevenueOverTime([]);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const fetchTracking = useCallback(async (token, { silent = false } = {}) => {
    if (!token) return;
    if (!silent) setTrackingLoading(true);
    setTrackingError('');
    try {
      const data = await getTripTracking(token);
      setTracking(Array.isArray(data) ? data : []);
    } catch (err) {
      setTrackingError(err.response?.data?.detail || 'Failed to load live tracking.');
    } finally {
      if (!silent) setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    fetchTracking(token);
    const intervalId = window.setInterval(() => {
      if (!cancelled) fetchTracking(token, { silent: true });
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [fetchTracking]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const controller = new AbortController();
    const decoder = new TextDecoder();
    let buffer = '';
    let closed = false;
    let debounceId = null;

    const scheduleRefresh = () => {
      if (debounceId) return;
      debounceId = window.setTimeout(() => {
        debounceId = null;
        fetchTracking(token, { silent: true });
      }, 300);
    };

    const run = async () => {
      try {
        const res = await fetch(`${baseUrl}/trips/tracking/stream`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        while (!closed) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n');
          buffer = parts.pop() || '';

          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const msg = JSON.parse(trimmed);
              if (msg?.type === 'tracking_event') scheduleRefresh();
            } catch {
              0;
            }
          }
        }
      } catch {
        0;
      }
    };

    run();
    return () => {
      closed = true;
      if (debounceId) window.clearTimeout(debounceId);
      controller.abort();
    };
  }, [fetchTracking]);

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
      } catch {
        setRoutes([]);
        setVehicles([]);
        setDrivers([]);
      }
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
      setSubscriptionStatus(created?.status);
      setSubscriptionDetails(created);
      navigate('/payment', {
        state: { referenceType: 'SUBSCRIPTION', referenceId: String(created?.id ?? '') },
      });
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
                  <div className="inline-block" title={subscriptionStatus === 'PENDING' ? 'Subscription request pending' : subscriptionStatus === 'PAYMENT_PENDING' ? 'Complete payment to send request to Transport Officer' : ''}>
                    {subscriptionStatus === 'PAYMENT_PENDING' ? (
                      <Button onClick={() => navigate('/payment', { state: { referenceType: 'SUBSCRIPTION', referenceId: String(subscriptionDetails?.id ?? '') } })}>
                        Complete payment
                      </Button>
                    ) : (
                      <Button onClick={() => setSubscribeOpen(true)} disabled={subscriptionStatus === 'PENDING'}>
                        {subscriptionStatus === 'PENDING' ? 'Pending Approval' : 'Subscribe'}
                      </Button>
                    )}
                  </div>
                )}
              </WelcomeBanner>
              {isSubscribed && isOnLeave && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm font-medium animate-in fade-in duration-300">
                  You are on leave for this period: {activeLeavePeriods.map((l) => `${formatLeaveDate(l.from_date)} – ${formatLeaveDate(l.to_date)}${l.reason ? ` (${l.reason})` : ''}`).join('; ')}.
                </div>
              )}
            </div>

            <div id="to-tracking" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Live tracking</h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  {trackingLoading ? (
                    <div className="text-sm text-gray-600">Loading live updates...</div>
                  ) : trackingError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{trackingError}</div>
                  ) : tracking.length === 0 ? (
                    <div className="text-sm text-gray-600">No active trips to track right now.</div>
                  ) : (
                    <div className="space-y-3">
                      {tracking.map((t) => {
                        const eventAt = t.last_event_at || t.started_at;
                        const when = timeAgo(eventAt, nowMs);

                        let statusLine = `Trip started ${when}.`;
                        if (t.last_event_type === 'arrived' && t.last_stop_name) {
                          statusLine = `Vehicle arrived at ${t.last_stop_name} ${when}.`;
                        } else if (t.last_event_type === 'departed' && t.last_stop_name) {
                          statusLine = `Departed from ${t.last_stop_name} ${when}.`;
                        }

                        const hasStops = Array.isArray(t.stops) && t.stops.length > 0;

                        return (
                          <div key={t.trip_id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate">{t.route_name || 'Route'}</div>
                                <div className="text-xs text-gray-500">Direction: {t.direction}</div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {String(t.trip_date).slice(0, 10)} | {String(t.start_time).slice(0, 5)}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">{statusLine}</div>
                            {hasStops && (
                              <div className="mt-3">
                                <div className="relative">
                                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
                                  {t.stops
                                    .slice()
                                    .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
                                    .map((stop, index, arr) => {
                                      const prev = index > 0 ? arr[index - 1] : null;
                                      const arrived = Boolean(stop.arrived_at);
                                      const departed = Boolean(stop.departed_at);
                                      const isCurrent =
                                        t.last_event_type === 'arrived' && t.last_stop_name && t.last_stop_name === stop.stop_name;

                                      let dotClass = 'border-gray-300 bg-white';
                                      if (departed || isCurrent) {
                                        dotClass = 'border-emerald-500 bg-emerald-500';
                                      } else if (arrived) {
                                        dotClass = 'border-emerald-500 bg-white';
                                      }

                                      const topActive = prev && prev.departed_at;
                                      const bottomActive = departed;

                                      return (
                                        <div key={`${stop.sequence_number}-${stop.stop_name}`} className="relative flex items-start">
                                          <div className="flex flex-col items-center mr-3">
                                            {index > 0 && (
                                              <div
                                                className={`h-4 w-px ${topActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                              />
                                            )}
                                            <div
                                              className={`h-3 w-3 rounded-full border-2 ${dotClass}`}
                                              style={{ marginTop: index === 0 ? 0 : 0 }}
                                            />
                                            {index < arr.length - 1 && (
                                              <div
                                                className={`h-4 w-px ${bottomActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                              />
                                            )}
                                          </div>
                                          <div className="pb-3">
                                            <div className="text-sm font-medium text-gray-900">{stop.stop_name}</div>
                                            <div className="text-xs text-gray-500 space-x-2">
                                              {stop.arrived_at && (
                                                <span>Arrived: {formatTimeLocal(stop.arrived_at)}</span>
                                              )}
                                              {stop.departed_at && (
                                                <span>Departed: {formatTimeLocal(stop.departed_at)}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div id="to-review" className="scroll-mt-24">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Review & Notify</h2>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                  <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                    <ActionCard
                      icon={FileText}
                      label={
                        <span>
                          Subscription requests
                          <span className="text-red-600 font-bold ml-1">({subscriptionCount})</span>
                        </span>
                      }
                      description="Review and manage pending subscription requests."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/subscription-requests')}
                    />
                    <ActionCard
                      icon={FileText}
                      label={
                        <span>
                          Transport Requests
                          <span className="text-red-600 font-bold ml-1">({transportRequestCount})</span>
                        </span>
                      }
                      description="Review and manage faculty transport requests."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/dashboard/transport-requests/manage')}
                    />
                    <ActionCard
                      icon={FileText}
                      label={
                        <span>
                          Driver Requests
                          <span className="text-red-600 font-bold ml-1">({driverRequestCount})</span>
                        </span>
                      }
                      description="Review and manage driver requests."
                      iconClassName="text-primary-600"
                      onClick={() => navigate('/dashboard/driver-requests/manage')}
                    />
                    {/* <ActionCard
                      icon={FileText}
                      label="Notify Users"
                      description="Notify users about important updates."
                      iconClassName="text-primary-600"
                      onClick={() => window.alert('Notify users about important updates.')}
                    /> */}
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
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
                {analyticsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                    {analyticsError}
                  </div>
                )}
                {analyticsLoading ? (
                  <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-8 text-center text-gray-500">
                    Loading analytics…
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ridership over time (last 14 days)</h3>
                      {ridershipOverTime.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No data for this period.</p>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ridershipOverTime.map((d) => ({ ...d, dateLabel: String(d.date).slice(0, 10) }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(value) => [value, '']} labelFormatter={(label) => `Date: ${label}`} />
                              <Legend />
                              <Bar dataKey="trips_count" name="Trips" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="seats_used" name="Seats used" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ridership by route (last 30 days)</h3>
                      {ridershipByRoute.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No data for this period.</p>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ridershipByRoute} layout="vertical" margin={{ top: 8, right: 8, left: 80, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis type="number" tick={{ fontSize: 11 }} />
                              <YAxis type="category" dataKey="route_name" width={75} tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="passengers_total" name="Passengers" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Revenue over time (last 14 days)</h3>
                      {revenueOverTime.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No data for this period.</p>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueOverTime.map((d) => ({ ...d, dateLabel: String(d.date).slice(0, 10), total_amount: Number(d.total_amount) }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(value, name) => [name === 'total_amount' ? `BDT ${value}` : value, name === 'total_amount' ? 'Amount' : name]} labelFormatter={(label) => `Date: ${label}`} />
                              <Legend />
                              <Line type="monotone" dataKey="total_amount" name="Amount (BDT)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="token_count" name="Token payments" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="subscription_count" name="Subscription payments" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
