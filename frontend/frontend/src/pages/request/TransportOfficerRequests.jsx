import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getAllTransportRequests } from '../../services/transport';

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    DECLINED: 'bg-red-100 text-red-800',
    ASSIGNED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default function TransportOfficerRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTransportRequests(filter || null);
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterChange = (status) => {
    setFilter(status === filter ? '' : status);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Manage Transport Requests</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {['PENDING', 'APPROVED', 'ASSIGNED', 'COMPLETED', 'DECLINED'].map((status) => (
                <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        filter === status 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No transport requests found matching current filter.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <Card 
              key={req.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary-600"
              onClick={() => navigate(`/dashboard/transport-requests/${req.id}/manage`)}
            >
              <div className="flex justify-between items-start mb-2">
                <StatusBadge status={req.status} />
                <span className="text-xs text-gray-500">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1 truncate" title={req.event_title}>{req.event_title}</h3>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                {req.event_date}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {req.guests.length} Guest{req.guests.length !== 1 ? 's' : ''}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
