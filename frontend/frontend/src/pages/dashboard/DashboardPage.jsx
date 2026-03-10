import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Ticket, XCircle, User, Briefcase, Car } from 'lucide-react';
import axios from 'axios';

import { Button } from '../../components/ui/Button';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SubscriptionModal from '../../modals/SubscriptionModal';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import PickupChangeModal from '../../modals/PickupChangeModal';
import UpdateLeaveModal from '../../modals/update_leave';
import { createSubscription, getSubscription, createLeave, getMyLeaves, getTripTracking } from '../../services/auth';
import { Navbar } from '../../components/Navbar';
import DashboardLayout from './DashboardLayout';


function normalizeIsoToUtc(s) {
  if (!s) return s;
  const str = String(s);
  // If timezone is already present (Z or +hh:mm / -hh:mm), keep as is
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userEmail } = useCurrentUser();
  const [userRoles, setUserRoles] = useState([]); // Store all user roles
  
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pickupChangeOpen, setPickupChangeOpen] = useState(false);

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [updateLeaveOpen, setUpdateLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ from_date: '', to_date: '', reason: '' });
  const [leaveError, setLeaveError] = useState('');
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveSuccessView, setLeaveSuccessView] = useState(false);
  const [leaveSuccessPeriod, setLeaveSuccessPeriod] = useState(null);

  const [tracking, setTracking] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const navLinks = [
    { name: 'Overview', targetId: 'dashboard-welcome' },
    { name: 'Tracking', targetId: 'dashboard-tracking' },
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

  useEffect(() => {
    if (subscriptionStatus === 'ACTIVE') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      getMyLeaves(token)
        .then((data) => setLeaves(Array.isArray(data) ? data : []))
        .catch(() => setLeaves([]));
    }
  }, [subscriptionStatus]);

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || userEmail === 'transportofficer@iut-dhaka.edu') return;

    let cancelled = false;

    fetchTracking(token);
    const intervalId = window.setInterval(() => {
      if (!cancelled) fetchTracking(token, { silent: true });
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [userEmail, fetchTracking]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || userEmail === 'transportofficer@iut-dhaka.edu') return;

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
              // ignore malformed lines
            }
          }
        }
      } catch {
        // streaming is best-effort; polling remains active as fallback
      }
    };

    run();
    return () => {
      closed = true;
      if (debounceId) window.clearTimeout(debounceId);
      controller.abort();
    };
  }, [userEmail, fetchTracking]);

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

  const MAX_LEAVE_DAYS = 120;

  const loadLeaves = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const data = await getMyLeaves(token);
      setLeaves(Array.isArray(data) ? data : []);
    } catch {
      setLeaves([]);
    }
  };

  const todayStr = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const activeLeavePeriods = React.useMemo(
    () => (Array.isArray(leaves) ? leaves.filter((l) => String(l.from_date).slice(0, 10) <= todayStr && String(l.to_date).slice(0, 10) >= todayStr) : []),
    [leaves, todayStr]
  );
  const isOnLeave = activeLeavePeriods.length > 0;
  const hasAnyLeave = Array.isArray(leaves) && leaves.length > 0;

  const formatLeaveDate = (d) => {
    if (!d) return '';
    const s = String(d).slice(0, 10);
    const [y, m, day] = s.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${Number(day)} ${months[Number(m) - 1]} ${y}`;
  };

  const handleTakeLeave = () => {
    if (!checkSubscription()) return;
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

  const openUpdateLeave = () => {
    if (!checkSubscription()) return;
    if (!hasAnyLeave) return;
    setUpdateLeaveOpen(true);
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
        {
          from_date: leaveForm.from_date,
          to_date: leaveForm.to_date,
          reason: leaveForm.reason || null,
        },
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

  const handleChangePickup = () => {
    if (checkSubscription()) {
        setPickupChangeOpen(true);
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

    const monthToNumber = (v) => Number.parseInt(String(v), 10);
    const monthsSelected = Math.max(1, monthToNumber(endMonth) - monthToNumber(startMonth) + 1);
    const subscriptionAmount = (monthsSelected * 5000).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    try {
      const created = await createSubscription(
        {
          start_month: startMonth,
          end_month: endMonth,
          year: Number(year),
          stop_name: stopName,
        },
        token
      );
      setSubscribeOpen(false);

      if (created?.status) setSubscriptionStatus(created.status);
      if (created) setSubscriptionDetails(created);

      navigate('/payment', {
        state: {
          referenceType: 'SUBSCRIPTION',
          referenceId: String(created?.id),
          monthsSelected,
          subscriptionAmount,
        },
      });
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
      <div className="pl-4 md:pl-32">
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-8">
          <div id="dashboard-welcome" className="scroll-mt-24">
            <WelcomeBanner>
              {subscriptionStatus !== 'ACTIVE' && (
                  <div className="inline-block" title={subscriptionStatus === 'PENDING' ? 'Subscription request pending' : subscriptionStatus === 'PAYMENT_PENDING' ? 'Complete payment to send request to Transport Officer' : ''}>
                  {subscriptionStatus === 'PAYMENT_PENDING' ? (
                    <Button onClick={() => navigate('/payment', { state: { referenceType: 'SUBSCRIPTION', referenceId: String(subscriptionDetails?.id || '') } })}>
                      Complete payment
                    </Button>
                  ) : (
                    <Button onClick={handleOpenSubscribe} disabled={subscriptionStatus === 'PENDING'}>
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

          {/* Subscription Section */}
          <div id="dashboard-subscription" className="scroll-mt-24">
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
                  label="Update leave"
                  description="Edit or cancel your leave periods."
                  iconClassName={isSubscribed && hasAnyLeave ? 'text-primary-600' : 'text-gray-400'}
                  onClick={openUpdateLeave}
                  disabled={!isSubscribed || !hasAnyLeave}
                  title={!isSubscribed ? 'Subscribe first' : !hasAnyLeave ? 'No leave to update' : ''}
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

          {/* Live Tracking Section */}
          <div id="dashboard-tracking" className="scroll-mt-24">
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

          {/* Faculty Section - Only visible to FACULTY role */}


          {/* Token & Other Services Section */}
          <div id="dashboard-services" className="scroll-mt-24">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">Services</h2>
              <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4">
                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(120px,150px))] justify-start">
                <ActionCard
                  icon={Car}
                  label="Transport request"
                  description="Request transport for guests."
                  iconClassName={isFaculty ? "text-primary-600" : "text-gray-400"}
                  onClick={handleGuestRequest}
                  disabled={!isFaculty}
                  title={!isFaculty ? "Available only for Faculty members" : ""}
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

        <PickupChangeModal
          open={pickupChangeOpen}
          onClose={() => setPickupChangeOpen(false)}
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
                  <p className="text-sm text-gray-600 mb-4">
                    Release your reserved seat for 1 day up to 4 months. Others can buy tokens for those dates.
                  </p>
                  {leaveError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {leaveError}
                    </div>
                  )}
                  <form onSubmit={handleLeaveSubmit} className="space-y-3 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                      <input
                        type="date"
                        value={leaveForm.from_date}
                        onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                      <input
                        type="date"
                        value={leaveForm.to_date}
                        onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                      <input
                        type="text"
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        placeholder="e.g. Vacation"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={leaveSaving}>
                        {leaveSaving ? 'Adding...' : 'Add leave'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setLeaveModalOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </form>
                  {/* Leave listing moved to Update Leave modal */}
                </>
              )}
            </div>
          </div>
        )}
      </section>
      </div>
      <UpdateLeaveModal open={updateLeaveOpen} onClose={() => setUpdateLeaveOpen(false)} />
    </DashboardLayout>
  );
}
