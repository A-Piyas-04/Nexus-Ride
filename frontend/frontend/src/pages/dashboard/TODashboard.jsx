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

  // 🆕 Schedule Trip States
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [tripData, setTripData] = useState({
    vehicle_id: '',
    driver_profile_id: '',
    route_id: '',
    direction: 'FROM_IUT',
    trip_date: '',
    start_time: '',
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

  // 🆕 Schedule Trip Submit
  const handleScheduleTrip = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert("Not authenticated");

    try {
      const response = await fetch("http://localhost:8000/trips/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tripData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to schedule trip");
      }

      alert("Trip Scheduled Successfully!");
      setScheduleOpen(false);
    } catch (err) {
      alert(err.message);
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

                    {/* 🆕 Schedule Trip Card */}
                    {isTO && (
                      <ActionCard
                        icon={Calendar}
                        label="Schedule Trip"
                        description="Create and schedule a new trip."
                        iconClassName="text-primary-600"
                        onClick={() => setScheduleOpen(true)}
                      />
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* 🆕 Schedule Trip Modal */}
            {scheduleOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                <div className="bg-white rounded-xl p-6 w-96 space-y-4">
                  <h3 className="text-lg font-bold">Schedule Trip</h3>

                  <input type="number" placeholder="Vehicle ID"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setTripData({...tripData, vehicle_id: Number(e.target.value)})}
                  />

                  <input type="number" placeholder="Driver Profile ID"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setTripData({...tripData, driver_profile_id: Number(e.target.value)})}
                  />

                  <input type="number" placeholder="Route ID"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setTripData({...tripData, route_id: Number(e.target.value)})}
                  />

                  {/* Direction Dropdown (LIMITED OPTIONS) */}
                  <select
                    className="w-full border p-2 rounded"
                    value={tripData.direction}
                    onChange={(e) => setTripData({...tripData, direction: e.target.value})}
                  >
                    <option value="FROM_IUT">FROM_IUT</option>
                    <option value="TO_IUT">TO_IUT</option>
                  </select>

                  <input type="date"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setTripData({...tripData, trip_date: e.target.value})}
                  />

                  <input type="time"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setTripData({...tripData, start_time: e.target.value})}
                  />

                  <div className="flex justify-between">
                    <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
                    <Button onClick={handleScheduleTrip}>Schedule</Button>
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