import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getDriverRequests, approveDriver } from '../services/auth';

export default function DriverListPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDrivers = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    setLoading(true);
    try {
      const list = await getDriverRequests(token);
      setDrivers(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleApprove = async (id) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    await approveDriver(id, token);
    await loadDrivers();
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Driver List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : drivers.length === 0 ? (
                <div className="text-sm text-gray-600">No pending drivers</div>
              ) : (
                <div className="w-full">
                  <div className="hidden md:grid md:grid-cols-12 py-2 px-2 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="md:col-span-4">Name</div>
                    <div className="md:col-span-3">Phone Number</div>
                    <div className="md:col-span-3">License Number</div>
                  </div>
                  <div className="divide-y">
                    {drivers.map((d) => (
                      <div key={d.id} className="grid grid-cols-1 md:grid-cols-12 items-center py-3 px-2">
                        <div className="md:col-span-4">
                          <div className="text-sm font-medium text-gray-900">{d.full_name || '—'}</div>
                          <div className="text-xs text-gray-500 md:hidden mt-1">Name</div>
                        </div>
                        <div className="md:col-span-3 mt-2 md:mt-0">
                          <div className="text-sm text-gray-900">{d.mobile_number || '—'}</div>
                          <div className="text-xs text-gray-500 md:hidden mt-1">Phone Number</div>
                        </div>
                        <div className="md:col-span-3 mt-2 md:mt-0">
                          <div className="text-sm text-gray-900">{d.license_number || '—'}</div>
                          <div className="text-xs text-gray-500 md:hidden mt-1">License Number</div>
                        </div>
                        <div className="md:col-span-2 mt-3 md:mt-0 md:text-right">
                          <Button onClick={() => handleApprove(d.id)}>Accept</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Button variant="secondary" onClick={() => navigate('/to-dashboard')}>Back</Button>
        </div>
      </section>
    </DashboardLayout>
  );
}
