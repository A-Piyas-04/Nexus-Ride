import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../dashboard/DashboardLayout';
import { createVehicle } from '../../../services/transport';

export default function VehicleAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ vehicle_number: '', capacity: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const number = form.vehicle_number.trim();
    const capacityNum = Number(form.capacity);
    if (!number) {
      setError('Vehicle number is required.');
      return false;
    }
    if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
      setError('Capacity must be a positive number.');
      return false;
    }
    setError('');
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await createVehicle({
        vehicle_number: form.vehicle_number.trim(),
        capacity: Number(form.capacity),
      });
      navigate('/to-pages/vehicle-manage/vehicleList', { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 403) {
        setError('Only Transport Officers can create vehicles.');
      } else if (status === 400 && detail) {
        setError(detail);
      } else {
        setError('Failed to create vehicle.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-xl mx-auto space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
              <p className="text-sm text-gray-600">Create a new vehicle for assignment.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={form.vehicle_number}
                  onChange={onChange}
                  className="w-full p-2 border rounded-md"
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={onChange}
                  className="w-full p-2 border rounded-md"
                  min="1"
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/to-pages/vehicle-manage/vehicleList')}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
