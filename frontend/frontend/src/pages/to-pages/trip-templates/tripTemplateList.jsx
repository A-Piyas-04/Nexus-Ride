import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../dashboard/DashboardLayout';
import {
  getTripTemplates,
  createTripTemplate,
  updateTripTemplate,
  deleteTripTemplate,
  getRoutes,
  getAllVehicles,
  getAllDrivers,
} from '../../../services/transport';
import { Button } from '../../../components/ui/Button';

function formatTime(str) {
  if (!str) return '—';
  if (typeof str === 'string' && str.length >= 5) return str.slice(0, 5);
  return str;
}

export default function TripTemplateList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    route_id: '',
    vehicle_id: '',
    driver_profile_id: '',
    direction: 'FROM_IUT',
    start_time: '07:30',
    is_active: true,
    valid_from: '',
    valid_to: '',
  });

  const fetchTemplates = async () => {
    try {
      setError('');
      const data = await getTripTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load trip templates.');
      setTemplates([]);
    }
  };

  const loadOptions = async () => {
    try {
      const [routesData, vehiclesData, driversData] = await Promise.all([
        getRoutes(),
        getAllVehicles(),
        getAllDrivers(),
      ]);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      const approved = (Array.isArray(driversData) ? driversData : []).filter((d) => d.driver_status === 1);
      setDrivers(approved);
    } catch (e) {
      console.error('Load options failed', e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      await loadOptions();
      if (!cancelled) await fetchTemplates();
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const routeMap = React.useMemo(() => {
    const m = {};
    routes.forEach((r) => { m[r.id] = r.route_name; });
    return m;
  }, [routes]);
  const vehicleMap = React.useMemo(() => {
    const m = {};
    vehicles.forEach((v) => { m[v.id] = v.vehicle_number; });
    return m;
  }, [vehicles]);
  const driverMap = React.useMemo(() => {
    const m = {};
    drivers.forEach((d) => { m[d.id] = d.full_name || 'Driver'; });
    return m;
  }, [drivers]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      route_id: '',
      vehicle_id: '',
      driver_profile_id: '',
      direction: 'FROM_IUT',
      start_time: '07:30',
      is_active: true,
      valid_from: '',
      valid_to: '',
    });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      route_id: t.route_id || '',
      vehicle_id: t.vehicle_id || '',
      driver_profile_id: t.driver_profile_id !== undefined ? String(t.driver_profile_id) : '',
      direction: t.direction || 'FROM_IUT',
      start_time: formatTime(t.start_time) || '07:30',
      is_active: t.is_active !== false,
      valid_from: t.valid_from ? t.valid_from.slice(0, 10) : '',
      valid_to: t.valid_to ? t.valid_to.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.route_id || !form.vehicle_id || !form.driver_profile_id || !form.start_time) {
      setError('Route, vehicle, driver and start time are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        route_id: form.route_id,
        vehicle_id: form.vehicle_id,
        driver_profile_id: parseInt(form.driver_profile_id, 10),
        direction: form.direction,
        start_time: form.start_time.length === 5 ? `${form.start_time}:00` : form.start_time,
        is_active: form.is_active,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
      };
      if (editing) {
        const updated = await updateTripTemplate(editing.id, payload);
        setTemplates((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createTripTemplate(payload);
        setTemplates((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Request failed';
      setError(Array.isArray(msg) ? msg.map((x) => x.msg || x).join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm('Delete this trip template?')) return;
    try {
      await deleteTripTemplate(t.id);
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
    } catch {
      setError('Failed to delete template.');
    }
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip Templates</h1>
              <p className="text-sm text-gray-600">
                Recurring schedule used to generate daily trips. Edit templates here; trips are generated automatically each day.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button onClick={openCreate}>Add Template</Button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading trip templates...</div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-600">
              No trip templates. Add one to start generating daily trips.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                    <th className="px-6 py-4 font-semibold">Route</th>
                    <th className="px-6 py-4 font-semibold">Vehicle</th>
                    <th className="px-6 py-4 font-semibold">Driver</th>
                    <th className="px-6 py-4 font-semibold">Direction</th>
                    <th className="px-6 py-4 font-semibold">Start time</th>
                    <th className="px-6 py-4 font-semibold">Active</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{routeMap[t.route_id] || t.route_id}</td>
                      <td className="px-6 py-4">{vehicleMap[t.vehicle_id] || t.vehicle_id}</td>
                      <td className="px-6 py-4">{driverMap[t.driver_profile_id] || t.driver_profile_id}</td>
                      <td className="px-6 py-4">{t.direction}</td>
                      <td className="px-6 py-4">{formatTime(t.start_time)}</td>
                      <td className="px-6 py-4">{t.is_active ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="text-primary-600 hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-bold mb-4">{editing ? 'Edit Template' : 'Add Template'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={form.route_id}
                    onChange={(e) => setForm({ ...form, route_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                    value={form.vehicle_id}
                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                    value={form.driver_profile_id}
                    onChange={(e) => setForm({ ...form, driver_profile_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="FROM_IUT">FROM_IUT</option>
                    <option value="TO_IUT">TO_IUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Valid from (optional)</label>
                    <input
                      type="date"
                      value={form.valid_from}
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Valid to (optional)</label>
                    <input
                      type="date"
                      value={form.valid_to}
                      onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
