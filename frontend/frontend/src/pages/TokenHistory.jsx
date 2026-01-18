import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Ticket, XCircle, History } from 'lucide-react';

export default function TokenHistory({ onBack }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Token History</h1>
        <p className="text-gray-600">Overview of tokens bought and cancelled</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Ticket className="h-4 w-4 text-primary-600 mr-2" />
              <span>Bought token for Route A</span>
            </div>
            <span className="text-sm text-gray-500">2026-01-12 10:30</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              <span>Cancelled token for Route B</span>
            </div>
            <span className="text-sm text-gray-500">2026-01-13 14:05</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <History className="h-4 w-4 text-gray-700 mr-2" />
              <span>Used token for Route C</span>
            </div>
            <span className="text-sm text-gray-500">2026-01-14 08:45</span>
          </div>
        </CardContent>
      </Card>
      {onBack && (
        <div>
          <Button variant="secondary" onClick={onBack}>Back to Dashboard</Button>
        </div>
      )}
    </div>
  );
}
