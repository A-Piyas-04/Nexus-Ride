import React from 'react';
import { XCircle } from 'lucide-react';

import { Button } from '../components/ui/Button';

export default function SubscriptionDetailsModal({ open, onClose, subscription, loading }) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const status = subscription?.status || 'Unavailable';
  const routeName = subscription?.route_name || 'Unavailable';
  const stopName = subscription?.stop_name || 'Unavailable';
  const startDate = subscription?.start_date || 'Unavailable';
  const endDate = subscription?.end_date || 'Unavailable';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close subscription details modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <div className="text-lg font-semibold text-gray-900">Subscription details</div>
            <div className="text-sm text-gray-600">Overview of your current subscription</div>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close subscription details modal">
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Loading details...
            </div>
          )}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-600">Plan</div>
                <div className="mt-1 font-semibold text-gray-900">Monthly Subscriber</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-600">Status</div>
                <div className="mt-1 font-semibold text-gray-900">{status}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-600">Route</div>
                <div className="mt-1 font-semibold text-gray-900">{routeName}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-600">Pickup location</div>
                <div className="mt-1 font-semibold text-gray-900">{stopName}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-600">Start date</div>
                <div className="mt-1 font-semibold text-gray-900">{startDate}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-600">End date</div>
                <div className="mt-1 font-semibold text-gray-900">{endDate}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
