import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Truck, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getMyTransportRequests, getTransportRequestById } from '../../services/transport';

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

export const FacultyRequestsList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getMyTransportRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading requests...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">My Transport Requests</h1>
        </div>
        <Button onClick={() => navigate('/dashboard/transport-requests/new')}>
          New Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No transport requests found. Create one to get started.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <Card 
              key={req.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/dashboard/transport-requests/${req.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <StatusBadge status={req.status} />
                <span className="text-xs text-gray-500">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{req.event_title}</h3>
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
};

export const TransportRequestDetail = ({ requestId }) => {
  const navigate = useNavigate();
  // If requestId is passed as prop, use it (for modal/inline), else grab from URL params logic in parent wrapper
  // But for now, we'll assume this is a page component and we might need to parse URL if not passed.
  // Ideally, let's make this a page component that uses useParams.
  // However, since I'm writing multiple components in one file for now or need to split, I'll assume standard page usage.
  
  // Note: Since I cannot easily import useParams here without splitting or assuming, I will implement a wrapper in the main export or expect the ID from a prop if used directly.
  // For the router, we will use a wrapper.
  
  // Let's rewrite this component to be a standalone page that uses useParams
  return null; 
};
