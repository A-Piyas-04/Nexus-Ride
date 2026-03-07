import React, { useEffect, useMemo, useState } from 'react';
import { X, Bus, CalendarDays, Clock, Route as RouteIcon, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { getMyDriverProfile, getTripsAvailability } from '../services/auth';

export default function AssignedVehiclesModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState(null);
  const [trips, setTrips] = useState([]);

  const hasTrips = useMemo(() => Array.isArray(trips) && trips.length > 0, [trips]);
  const featuredAndRest = useMemo(() => {
    if (!hasTrips) return { featured: null, rest: [] };
    // Prefer STARTED trip as featured; else next upcoming by date/time; fallback to first
    const started = trips.find((t) => String(t.status).toUpperCase() === 'STARTED');
    if (started) {
      return { featured: started, rest: trips.filter((t) => t !== started) };
    }
    const toKey = (t) => {
      // Build sortable key: date + time; fallback uses start_time string
      const d = t.trip_date ? new Date(t.trip_date) : null;
      const time = t.start_time || '';
      const k = `${d ? d.toISOString().slice(0, 10) : '9999-99-99'}T${time}`;
      return k;
    };
    const sorted = [...trips].sort((a, b) => (toKey(a) < toKey(b) ? -1 : toKey(a) > toKey(b) ? 1 : 0));
    return { featured: sorted[0], rest: sorted.slice(1) };
  }, [trips, hasTrips]);

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      setTrips([]);
      setVehicleNumber(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setError('Not authenticated');
          return;
        }
        const profile = await getMyDriverProfile(token);
        const vehNum = profile?.assigned_vehicle_number || profile?.vehicle_number || null;
        setVehicleNumber(vehNum);
        const av = await getTripsAvailability(token).catch(() => []);
        let list = av || [];
        if (vehNum) {
          list = list.filter((t) => String(t.vehicle_number) === String(vehNum));
        }
        if (!vehNum && profile?.full_name) {
          list = list.filter((t) => String(t.driver_name) === String(profile.full_name));
        }
        setTrips(list);
      } catch (e) {
        console.error('Error fetching assigned vehicle:', e);
        setError('Failed to load assigned vehicle');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open]);

  if (!open) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      onClick={onBackdrop}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-8"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-3xl">
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-start">
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary-600" />
              Assigned Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : null}

            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs uppercase text-gray-500">Vehicle Number</div>
                      <div className="text-lg font-semibold text-gray-900">{vehicleNumber || 'Not assigned'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase text-gray-500">Trips Listed</div>
                      <div className="text-lg font-semibold text-gray-900">{trips.length}</div>
                    </div>
                  </div>
                </div>

                {!hasTrips ? (
                  <div className="text-sm text-gray-600">No trips found for the assigned vehicle.</div>
                ) : (
                  <div className="space-y-4">
                    {/* Featured (current) trip large card */}
                    {featuredAndRest.featured ? (
                      <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-base md:text-lg font-semibold text-gray-900">
                            {featuredAndRest.featured.route_name || 'Route'}
                          </div>
                          <div className="text-xs md:text-sm px-2 py-1 rounded-md bg-primary-50 text-primary-700 border border-primary-100">
                            {featuredAndRest.featured.status || 'SCHEDULED'}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm md:text-base text-gray-700">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gray-500" />
                            <span>{featuredAndRest.featured.trip_date || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{featuredAndRest.featured.start_time || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RouteIcon className="h-4 w-4 text-gray-500" />
                            <span>Vehicle: {featuredAndRest.featured.vehicle_number || vehicleNumber || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="h-4 w-4 text-gray-500" />
                            <span>Direction: {featuredAndRest.featured.direction || '—'}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Previous trips smaller cards, stacked */}
                    {featuredAndRest.rest.length > 0 ? (
                      <div className="space-y-3">
                        {featuredAndRest.rest.map((t) => (
                          <div key={`${t.id}-${t.start_time}`} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold text-gray-900">{t.route_name || 'Route'}</div>
                              <div className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">{t.status || 'SCHEDULED'}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                                <span>{t.trip_date || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                <span>{t.start_time || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <RouteIcon className="h-3.5 w-3.5 text-gray-500" />
                                <span>{t.vehicle_number || vehicleNumber || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <ArrowRightLeft className="h-3.5 w-3.5 text-gray-500" />
                                <span>{t.direction || '—'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
