import React from 'react';
import { Card, CardContent } from './Card';

export function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {helper && <p className="text-xs text-gray-500">{helper}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50">
          {React.createElement(Icon, { className: 'h-5 w-5 text-primary-600' })}
        </div>
      </CardContent>
    </Card>
  );
}
