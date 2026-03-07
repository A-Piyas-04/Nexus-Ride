import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getSubscription, changePickupToday, getPickupToday } from '../services/auth';
import { getAllRoutes } from '../services/transport';

export default function PickupChangeModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState('');
  const [currentStopName, setCurrentStopName] = useState('');
  const [overrideStopName, setOverrideStopName] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 1. Get current subscription to find route
      const sub = await getSubscription(token);
      if (!sub || sub.status !== 'ACTIVE') {
        setError('No active subscription found.');
        setLoading(false);
        return;
      }
      
      // 2. Get current override if any
      const pickupData = await getPickupToday(token);
      if (pickupData.is_override) {
        setOverrideStopName(pickupData.stop_name);
        setCurrentStopName(pickupData.stop_name);
      } else {
        setOverrideStopName(null);
        setCurrentStopName(sub.stop_name);
      }

      // 3. Find route ID for the subscription stop
      const routes = await getAllRoutes();
      let foundStops = [];
      
      // Find route containing the subscription stop
      for (const route of routes) {
        if (route.stops.some(s => s.stop_name === sub.stop_name)) {
          // Sort stops by sequence
          foundStops = route.stops.sort((a, b) => a.sequence_number - b.sequence_number);
          setStops(foundStops);
          break;
        }
      }

      if (!foundStops.length) {
        setError('Could not determine route for your subscription.');
      }

    } catch (err) {
      console.error('Failed to load pickup data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStop) return;

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await changePickupToday(selectedStop, token);
      setSuccess('Pickup location updated for today.');
      
      // Refresh data
      const pickupData = await getPickupToday(token);
      setOverrideStopName(pickupData.stop_name);
      setCurrentStopName(pickupData.stop_name);
      
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update pickup location.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Change Pickup (Today Only)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading && !stops.length ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <p>
                  <strong>Current Pickup:</strong> {currentStopName} {overrideStopName && '(Override)'}
                </p>
                <p className="mt-1 text-xs">
                  Changing this will only affect today's trip. Your permanent subscription remains unchanged.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success ? (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 text-center">
                  <p className="font-medium">{success}</p>
                  <div className="mt-4">
                    <Button onClick={onClose} className="w-full">Close</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select New Pickup Stop
                    </label>
                    <select
                      value={selectedStop}
                      onChange={(e) => setSelectedStop(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none bg-white"
                      required
                    >
                      <option value="">-- Select Stop --</option>
                      {stops.map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.stop_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading || !selectedStop} className="flex-1">
                      {loading ? 'Updating...' : 'Confirm Change'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
