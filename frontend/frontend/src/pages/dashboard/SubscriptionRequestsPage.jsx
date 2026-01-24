import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, User, X } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { getSubscriptionRequests, approveSubscription, declineSubscription } from '../../services/auth';
import { useAuth } from '../../context/auth-context';

export default function SubscriptionRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await getSubscriptionRequests(token);
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load subscription requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      await approveSubscription(id, token);
      // Remove the approved request from the list
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      console.error('Failed to approve subscription:', err);
      // You might want to show a toast or error message here
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id) => {
    if (!window.confirm('Are you sure you want to decline this request?')) {
        return;
    }
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      await declineSubscription(id, token);
      // Remove the declined request from the list
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      console.error('Failed to decline subscription:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout user={user} title="Subscription Requests">
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <Button variant="outline" size="icon" onClick={() => navigate('/to-dashboard')} className="hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Requests</h1>
            <p className="text-sm text-gray-500 font-medium">Review and manage subscription applications</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-2">
            <X className="h-5 w-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Check className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No Pending Requests</h3>
              <p className="text-gray-500 mt-2">All subscription requests have been processed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden border-t-4 border-t-primary-500 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-white pb-4 border-b border-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 p-2.5 rounded-full border border-primary-100">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">{request.user_name || 'Unknown User'}</CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                           Requested on: {request.start_date ? new Date(request.start_date).toLocaleDateString() : 'N/A'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold border border-amber-100">
                      <Clock className="h-3 w-3" />
                      Pending
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div className="space-y-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between py-1 border-b border-gray-200 border-dashed pb-2">
                      <span className="text-gray-500 font-medium">Route</span>
                      <span className="font-semibold text-gray-900">{request.route_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200 border-dashed pb-2">
                      <span className="text-gray-500 font-medium">Pickup Stop</span>
                      <span className="font-semibold text-gray-900">{request.stop_name}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 font-medium">Duration</span>
                      <span className="font-semibold text-gray-900">
                        {request.start_date} - {request.end_date}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                      <Button 
                        variant="destructive"
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border" 
                        onClick={() => handleDecline(request.id)}
                        isLoading={processingId === request.id}
                        disabled={processingId !== null && processingId !== request.id}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={() => handleApprove(request.id)}
                        isLoading={processingId === request.id}
                        disabled={processingId !== null && processingId !== request.id}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
