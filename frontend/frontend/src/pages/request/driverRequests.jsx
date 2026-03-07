import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Check, X, Clock } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { getDriverRequests, approveDriver } from '../../services/auth';

export default function DriverRequestsPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchDrivers = async () => {
    setError(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setDrivers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getDriverRequests(token);
      setDrivers(list || []);
    } catch (err) {
      console.error('Failed to load driver requests', err);
      setError('Failed to load driver requests');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleApprove = async (driver) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    const id = Number(driver.id);
    if (Number.isNaN(id)) return;
    setProcessingId(id);
    setError(null);
    try {
      const result = await approveDriver(id, token);
      await fetchDrivers();
      const mobile = result?.mobile_number || driver.mobile_number;
      if (mobile) {
        window.alert(`Driver approved. They can log in with mobile: ${mobile}`);
      } else {
        window.alert('Driver approved successfully.');
      }
    } catch (err) {
      console.error('Failed to approve driver', err);
      setError('Failed to approve driver. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate('/to-dashboard')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Driver Requests</h1>
            <p className="text-sm text-gray-500 font-medium">
              Review and approve pending driver registrations
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-2">
            <X className="h-5 w-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : drivers.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Check className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No Pending Driver Requests</h3>
              <p className="text-gray-500 mt-2">
                All driver registration requests have been processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {drivers.map((driver) => (
                <Card key={driver.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {driver.full_name || 'Unknown Driver'}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Phone: <span className="font-medium text-gray-900">{driver.mobile_number || '—'}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        License:{' '}
                        <span className="font-medium text-gray-900">
                          {driver.license_number || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(driver)}
                        isLoading={processingId === driver.id}
                        disabled={processingId !== null && processingId !== driver.id}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map((driver) => (
                <Card
                  key={driver.id}
                  className="overflow-hidden border-t-4 border-t-primary-500 hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="bg-white pb-4 border-b border-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 p-2.5 rounded-full border border-primary-100">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900">
                            {driver.full_name || 'Unknown Driver'}
                          </CardTitle>
                          <CardDescription className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Pending approval
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-3">
                    <div className="space-y-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between py-1 border-b border-gray-200 border-dashed pb-2">
                        <span className="text-gray-500 font-medium">Phone Number</span>
                        <span className="font-semibold text-gray-900">
                          {driver.mobile_number || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500 font-medium">License Number</span>
                        <span className="font-semibold text-gray-900">
                          {driver.license_number || '—'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button
                      className="w-full"
                      onClick={() => handleApprove(driver)}
                      isLoading={processingId === driver.id}
                      disabled={processingId !== null && processingId !== driver.id}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve Driver
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
        </div>
      </section>
    </DashboardLayout>
  );
}
