import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

const METHODS = [
  { value: 'BKASH', label: 'Bkash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'UPAY', label: 'Upay' },
];

export default function PaymentMethodSelector({ value, onChange, disabled }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {METHODS.map((method) => (
          <button
            key={method.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(method.value)}
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-left transition-colors',
              value === method.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:bg-gray-50',
              disabled && 'opacity-60 pointer-events-none'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">{method.label}</div>
              <div
                className={cn(
                  'h-4 w-4 rounded-full border',
                  value === method.value ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                )}
              />
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

