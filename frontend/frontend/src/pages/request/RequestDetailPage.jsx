import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MapPin, Truck, MessageSquare, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getTransportRequestById } from '../../services/transport';

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    DECLINED: 'bg-red-100 text-red-800',
    ASSIGNED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const data = await getTransportRequestById(id);
        setRequest(data);
      } catch (err) {
        setError('Failed to load request details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!request) return <div className="p-8 text-center">Request not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/transport-requests/my')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{request.event_title}</h2>
            <div className="flex items-center text-gray-500 mt-1">
              <Calendar className="h-4 w-4 mr-2" />
              {request.event_date}
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* Status Info / TO Reply */}
        {(request.to_reply_message || request.status === 'ASSIGNED') && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" /> Transport Office Update
                </h3>
                {request.to_reply_message && (
                    <p className="text-sm text-gray-700">"{request.to_reply_message}"</p>
                )}
                {request.assigned_vehicle_id && (
                    <div className="flex items-center text-sm text-purple-700 font-medium">
                        <Truck className="h-4 w-4 mr-2" />
                        Vehicle Assigned (ID: {request.assigned_vehicle_id})
                    </div>
                )}
            </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-4 w-4 mr-2" /> Guest List ({request.guests.length})
          </h3>
          <div className="space-y-3">
            {request.guests.map((guest, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium text-gray-900">{guest.name}</div>
                <div className="flex items-center text-gray-600 mt-1 sm:mt-0">
                  <MapPin className="h-3 w-3 mr-1" />
                  {guest.pickup_location}
                </div>
                {guest.notes && (
                  <div className="text-gray-500 italic mt-1 sm:mt-0 max-w-xs truncate">
                    Note: {guest.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
