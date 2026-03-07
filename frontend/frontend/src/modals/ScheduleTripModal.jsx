import React from 'react';
import { Button } from '../components/ui/Button';

export default function ScheduleTripModal({
  open,
  onClose,
  onSubmit,
  data,
  onChange,
  routes = [],
  vehicles = [],
  drivers = [],
  error = '',
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold mb-2">Schedule one-off trip</h3>
        <p className="text-sm text-gray-600 mb-4">Create a single trip manually. For recurring schedule, use Trip Templates.</p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={data.route_id || ''}
              onChange={(e) => onChange({ ...data, route_id: e.target.value })}
              required
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={data.vehicle_id || ''}
              onChange={(e) => onChange({ ...data, vehicle_id: e.target.value })}
              required
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={data.driver_profile_id || ''}
              onChange={(e) => onChange({ ...data, driver_profile_id: e.target.value })}
              required
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={data.direction || 'FROM_IUT'}
              onChange={(e) => onChange({ ...data, direction: e.target.value })}
            >
              <option value="FROM_IUT">FROM_IUT</option>
              <option value="TO_IUT">TO_IUT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={data.trip_date || ''}
              onChange={(e) => onChange({ ...data, trip_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={data.start_time || '07:30'}
              onChange={(e) => onChange({ ...data, start_time: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
