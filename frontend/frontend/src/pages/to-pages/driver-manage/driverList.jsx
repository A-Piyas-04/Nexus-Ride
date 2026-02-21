import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../dashboard/DashboardLayout';
import { getAllDrivers } from '../../../services/transport';
import { Button } from '../../../components/ui/Button';

export default function DriverList() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllDrivers();
      const list = Array.isArray(data) ? data : [];
      const approved = list.filter((d) => d.driver_status === 1);
      setDrivers(approved);
    } catch {
      setError('Failed to load drivers.');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const renderStatusBadge = (status) => {
    const isApproved = status === 1;
    const label = isApproved ? 'APPROVED' : 'PENDING';
    const classes = isApproved
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-amber-100 text-amber-700 border-amber-300';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${classes}`}>
        {label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
              <p className="text-sm text-gray-600">
                List of approved drivers available for assignment.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading drivers...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-600">
              No approved drivers found.
            </div>
          ) : (
            <>
              <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Mobile</th>
                      <th className="px-6 py-4 font-semibold">License</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {drivers.map((driver) => (
                      <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {driver.full_name || 'Unnamed Driver'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {driver.email || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {driver.mobile_number || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {driver.license_number || '—'}
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(driver.driver_status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase text-gray-500">Name</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {driver.full_name || 'Unnamed Driver'}
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                          <div>
                            <span className="text-gray-500">Email: </span>
                            <span>{driver.email || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Mobile: </span>
                            <span>{driver.mobile_number || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">License: </span>
                            <span>{driver.license_number || '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {renderStatusBadge(driver.driver_status)}
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Suspend
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

