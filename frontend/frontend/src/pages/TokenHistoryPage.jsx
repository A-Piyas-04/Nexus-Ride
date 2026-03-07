import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertCircle } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import DashboardLayout from './dashboard/DashboardLayout';
import { getTokenHistory } from '../services/payments';

export default function TokenHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getTokenHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch token history:', err);
        setError('Failed to load token history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <section className="px-4 py-6 md:px-8 md:py-8">
        <div className="w-full max-w-6xl">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Token History</h1>
                <p className="text-gray-600">Overview of purchased tokens</p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading history...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500 flex flex-col items-center">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    {error}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No token history found.</div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.token_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3 mb-2 sm:mb-0">
                          <div className={`mt-1 p-2 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Ticket className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.route_name} <span className="text-gray-400 mx-1">•</span> {item.direction}
                            </p>
                            <p className="text-sm text-gray-600">
                              Pickup: {item.pickup_stop}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                              <span className="flex items-center">
                                <span className="font-medium mr-1">Vehicle:</span> {item.vehicle_number}
                              </span>
                              <span className="flex items-center">
                                <span className="font-medium mr-1">Driver:</span> {item.driver_name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col justify-between sm:items-end text-right pl-11 sm:pl-0">
                          <div>
                            <p className="font-medium text-gray-900">{formatDate(item.travel_date)}</p>
                            <p className="text-xs text-gray-500">Purchased: {formatDate(item.created_at)}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 inline-block ${
                            item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                            item.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
