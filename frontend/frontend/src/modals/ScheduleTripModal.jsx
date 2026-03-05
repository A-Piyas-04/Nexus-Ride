import React from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export default function ScheduleTripModal({ open, onClose, onSubmit, data, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const fieldClassName =
    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Trip"
      description="Create a new trip schedule"
    >
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Route ID</label>
          <input
            name="route_id"
            className={fieldClassName}
            value={data.route_id}
            onChange={handleChange}
            placeholder="Enter Route ID"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Direction</label>
          <select
            name="direction"
            className={fieldClassName}
            value={data.direction}
            onChange={handleChange}
          >
            <option value="TO_IUT">To IUT</option>
            <option value="FROM_IUT">From IUT</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Vehicle ID</label>
          <input
            name="vehicle_id"
            className={fieldClassName}
            value={data.vehicle_id}
            onChange={handleChange}
            placeholder="Enter Vehicle ID"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Driver Profile ID</label>
          <input
            name="driver_profile_id"
            className={fieldClassName}
            value={data.driver_profile_id}
            onChange={handleChange}
            placeholder="Enter Driver Profile ID"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="trip_date"
              className={fieldClassName}
              value={data.trip_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              name="start_time"
              className={fieldClassName}
              value={data.start_time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}
