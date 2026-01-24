import React from 'react';
import { XCircle } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ROUTE_DEFINITIONS } from '../constants/routes';

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function monthToNumber(value) {
  return Number.parseInt(value, 10);
}

function numberToMonth(value) {
  return String(value).padStart(2, '0');
}

export default function SubscriptionModal({ open, onClose, onSubmit }) {
  const now = React.useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const defaultMonth = numberToMonth(now.getMonth() + 1);

  const yearOptions = React.useMemo(
    () => Array.from({ length: 6 }, (_, index) => String(currentYear + index)),
    [currentYear]
  );

  const [startMonth, setStartMonth] = React.useState(defaultMonth);
  const [endMonth, setEndMonth] = React.useState(defaultMonth);
  const [year, setYear] = React.useState(String(currentYear));
  const [stopName, setStopName] = React.useState(ROUTE_DEFINITIONS[0].stops[0]);

  const endMonthOptions = React.useMemo(() => {
    const start = monthToNumber(startMonth);
    return MONTH_OPTIONS.filter((option) => monthToNumber(option.value) >= start);
  }, [startMonth]);

  React.useEffect(() => {
    if (!open) return;
    setStartMonth(defaultMonth);
    setEndMonth(defaultMonth);
    setYear(String(currentYear));
    setStopName(ROUTE_DEFINITIONS[0].stops[0]);
  }, [open, currentYear, defaultMonth]);

  React.useEffect(() => {
    const start = monthToNumber(startMonth);
    const end = monthToNumber(endMonth);
    if (end < start) setEndMonth(startMonth);
  }, [startMonth, endMonth]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ startMonth, endMonth, year, stopName });
  };

  const fieldClassName =
    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subscription"
      description="Choose period and stop"
    >
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Start month</div>
            <select
              className={fieldClassName}
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">End month</div>
            <select
              className={fieldClassName}
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
            >
              {endMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Year</div>
            <select
              className={fieldClassName}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Stop name</div>
            <select
              className={fieldClassName}
              value={stopName}
              onChange={(e) => setStopName(e.target.value)}
            >
              {ROUTE_DEFINITIONS.map((route) => (
                <optgroup key={route.route_name} label={route.route_name}>
                  {route.stops.map((stop) => (
                    <option key={stop} value={stop}>
                      {stop}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Subscribe</Button>
        </div>
      </form>
    </Modal>
  );
}
