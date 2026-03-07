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
  Calendar
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { ActionCard } from '../../components/ui/ActionCard';
import { WelcomeBanner } from '../../components/ui/WelcomeBanner';
import SubscriptionModal from '../../modals/SubscriptionModal';
import SubscriptionDetailsModal from '../../modals/SubscriptionDetailsModal';
import { createSubscription, getSubscription } from '../../services/auth';
import {
  createTrip,
  getRoutes,
  getAllVehicles,
  getAllDrivers,
} from '../../services/transport';
import { Navbar } from '../../components/Navbar';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/auth-context';

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

  const navLinks = [
    { name: 'Overview', targetId: 'to-welcome' },
    { name: 'Review', targetId: 'to-review' },
    { name: 'Manage', targetId: 'to-manage' },
    { name: 'Services', targetId: 'to-services' },
    { name: 'Subscription', targetId: 'to-subscription' },
    { name: 'Analytics', targetId: 'to-analytics' },
  ];

  const isTO = user?.roles?.some(role => [1, 3].includes(role.id));

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
      const startTime = String(tripData.start_time).length === 5
        ? `${tripData.start_time}:00`
        : tripData.start_time;
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

  return (
    <DashboardLayout>
      <Navbar links={navLinks} />
      <div className="pl-4 md:pl-32">
        <section className="w-full px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-6xl space-y-8">

            {/* MANAGE SECTION */}
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

            {scheduleOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold">Schedule one-off trip</h3>
                  {scheduleError && (
                    <p className="text-sm text-red-600">{scheduleError}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                    <select
                      className="w-full border border-gray-300 p-2 rounded"
                      value={tripData.route_id}
                      onChange={(e) => setTripData({ ...tripData, route_id: e.target.value })}
                    >
                      <option value="">Select route</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>{r.route_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                    <select
                      className="w-full border border-gray-300 p-2 rounded"
                      value={tripData.vehicle_id}
                      onChange={(e) => setTripData({ ...tripData, vehicle_id: e.target.value })}
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                    <select
                      className="w-full border border-gray-300 p-2 rounded"
                      value={tripData.driver_profile_id}
                      onChange={(e) => setTripData({ ...tripData, driver_profile_id: e.target.value })}
                    >
                      <option value="">Select driver</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.full_name || d.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <select
                      className="w-full border border-gray-300 p-2 rounded"
                      value={tripData.direction}
                      onChange={(e) => setTripData({ ...tripData, direction: e.target.value })}
                    >
                      <option value="FROM_IUT">FROM_IUT</option>
                      <option value="TO_IUT">TO_IUT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 p-2 rounded"
                      value={tripData.trip_date}
                      onChange={(e) => setTripData({ ...tripData, trip_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 p-2 rounded"
                      value={tripData.start_time}
                      onChange={(e) => setTripData({ ...tripData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button onClick={() => { setScheduleOpen(false); setScheduleError(''); }} disabled={scheduleLoading}>Cancel</Button>
                    <Button onClick={handleScheduleTrip} disabled={scheduleLoading}>
                      {scheduleLoading ? 'Scheduling...' : 'Schedule'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}