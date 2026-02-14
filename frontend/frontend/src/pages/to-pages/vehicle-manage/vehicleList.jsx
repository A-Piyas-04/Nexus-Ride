import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../dashboard/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { getAllVehicles, updateVehicleStatus, updateVehicle } from '../../../services/transport';

export default function VehicleList() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({ vehicle_number: '', capacity: '' });
  const [formError, setFormError] = useState('');

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

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      vehicle_number: vehicle.vehicle_number || '',
      capacity: String(vehicle.capacity ?? ''),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setConfirmOpen(false);
    setEditingVehicle(null);
    setForm({ vehicle_number: '', capacity: '' });
    setFormError('');
  };

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.vehicle_number || !form.vehicle_number.trim()) {
      setFormError('Vehicle number is required.');
      return false;
    }
    const cap = Number(form.capacity);
    if (!Number.isFinite(cap) || cap <= 0) {
      setFormError('Capacity must be a positive number.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;
    setConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    if (!editingVehicle) return;
    setSaving(true);
    setFormError('');
    try {
      const payload = {};
      if (form.vehicle_number !== editingVehicle.vehicle_number) {
        payload.vehicle_number = form.vehicle_number.trim();
      }
      const capNum = Number(form.capacity);
      if (capNum !== editingVehicle.capacity) {
        payload.capacity = capNum;
      }
      if (Object.keys(payload).length === 0) {
        setConfirmOpen(false);
        setSaving(false);
        setIsModalOpen(false);
        return;
      }
      const updated = await updateVehicle(editingVehicle.id, payload);
      setVehicles(prev =>
        prev.map(v => (v.id === editingVehicle.id ? { ...v, ...updated } : v))
      );
      setConfirmOpen(false);
      setIsModalOpen(false);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        'Failed to update vehicle.';
      setFormError(msg);
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="w-full px-4 py-8 md:px-8 md:py-10">
        <div className="w-full max-w-6xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
              <p className="text-sm text-gray-600">Overview of registered vehicles.</p>
            </div>
            <button
              onClick={() => navigate('/to-pages/vehicle-manage/vehicleAdd')}
              className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
            >
              Add Vehicle
            </button>
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
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
        {isModalOpen && editingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeEditModal}></div>
            <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Vehicle</h3>
              {formError && (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={form.vehicle_number}
                    onChange={onFormChange}
                    className="w-full p-2 border rounded-md"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={onFormChange}
                    className="w-full p-2 border rounded-md"
                    min="1"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClick}
                  className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                  disabled={saving}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-900 font-medium">
                Are you sure you want to update this vehicle?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  No
                </button>
                <button
                  onClick={confirmUpdate}
                  className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                  disabled={saving}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

    </DashboardLayout>
  );
}
