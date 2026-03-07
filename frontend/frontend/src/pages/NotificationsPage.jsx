import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, CheckCheck, Inbox } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import DashboardLayout from './dashboard/DashboardLayout';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../services/notifications';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(50); // Fetch up to 50
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <DashboardLayout>
      <section className="px-4 py-6 md:px-8 md:py-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Bell className="h-6 w-6" /> Notifications
                </h1>
                <p className="text-gray-600">Stay updated with your trips and requests</p>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" onClick={handleMarkAllRead} className="text-sm">
                  <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
                </Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading notifications...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                    <Inbox className="h-12 w-12 mb-4 text-gray-300" />
                    <p>No notifications yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex flex-col sm:flex-row sm:items-start justify-between p-4 transition-colors ${!item.is_read ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            {!item.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" title="Unread"></span>
                            )}
                            <h4 className={`font-semibold text-gray-900 ${!item.is_read ? 'text-blue-900' : ''}`}>
                              {item.title}
                            </h4>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                              {item.event_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.message}</p>
                          <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:self-center">
                          {!item.is_read && (
                            <button 
                              onClick={() => handleMarkRead(item.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
