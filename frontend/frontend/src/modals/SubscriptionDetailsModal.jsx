import React from 'react';

import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export default function SubscriptionDetailsModal({ open, onClose, subscription, loading }) {

  const status = subscription?.status || 'Unavailable';
  const routeName = subscription?.route_name || 'Unavailable';
  const stopName = subscription?.stop_name || 'Unavailable';
  const startDate = subscription?.start_date || 'Unavailable';
  const endDate = subscription?.end_date || 'Unavailable';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subscription details"
      description="Overview of your current subscription"
    >
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
    </Modal>
  );
}
