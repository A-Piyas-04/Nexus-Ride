import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../dashboard/DashboardLayout';
import { getAllVehicles, updateVehicleStatus } from '../../../services/transport';

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleStatusChange = async (vehicle, newStatus) => {
    if (vehicle.status === newStatus || updatingId) return;
    setError('');
    setUpdatingId(vehicle.id);
    try {
      const updated = await updateVehicleStatus(vehicle.id, newStatus);
      setVehicles(prev =>
        prev.map(v => (v.id === vehicle.id ? { ...v, status: updated.status } : v))
      );
    } catch {
      setError('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusButton = (vehicle, status, label, activeClasses, inactiveClasses) => {
    const active = vehicle.status === status;
    const base =
      'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors';
    const cls = active ? activeClasses : inactiveClasses;
    return (
      <button
        onClick={() => handleStatusChange(vehicle, status)}
        disabled={!!updatingId}
        className={`${base} ${cls} ${updatingId ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {label}
      </button>
    );
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-sm text-gray-600">Overview of registered vehicles.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading vehicles...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-600">
              No vehicles found.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                    <th className="px-6 py-4 font-semibold">Vehicle Number</th>
                    <th className="px-6 py-4 font-semibold">Capacity</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {vehicle.vehicle_number}
                      </td>
                      <td className="px-6 py-4">{vehicle.capacity}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {statusButton(
                            vehicle,
                            'AVAILABLE',
                            'AVAILABLE',
                            'bg-green-100 text-green-700 border-green-300',
                            'bg-white text-gray-700 border-gray-200 hover:bg-green-50'
                          )}
                          {statusButton(
                            vehicle,
                            'IN_SERVICE',
                            'IN SERVICE',
                            'bg-amber-100 text-amber-700 border-amber-300',
                            'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                          )}
                          {statusButton(
                            vehicle,
                            'UNDER_REPAIR',
                            'UNDER REPAIR',
                            'bg-red-100 text-red-700 border-red-300',
                            'bg-white text-gray-700 border-gray-200 hover:bg-red-50'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
