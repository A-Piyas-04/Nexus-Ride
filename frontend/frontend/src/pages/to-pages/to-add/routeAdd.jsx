import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, ArrowLeft, List } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../../components/ui/Button';
import { createRoute } from '../../../services/routeService';
import DashboardLayout from '../../dashboard/DashboardLayout';

export default function RouteAdd() {
  const navigate = useNavigate();
  const [routeName, setRouteName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [stops, setStops] = useState([
    { stop_name: '', sequence_number: 1 }
  ]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const roles = response.data.roles || [];
        const roleIds = roles.map(r => r.id);
        if (!(roleIds.includes(1) && roleIds.includes(3))) {
          alert('Access denied. You do not have the required permissions.');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Access verification failed:', error);
        navigate('/dashboard');
      } finally {
        setVerifying(false);
      }
    };
    verifyAccess();
  }, [navigate]);

  if (verifying) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleAddStop = () => {
    setStops([...stops, { stop_name: '', sequence_number: stops.length + 1 }]);
  };

  const handleRemoveStop = (index) => {
    const newStops = stops.filter((_, i) => i !== index);
    // Update sequence numbers
    const updatedStops = newStops.map((stop, i) => ({
      ...stop,
      sequence_number: i + 1
    }));
    setStops(updatedStops);
  };

  const handleStopChange = (index, value) => {
    const newStops = [...stops];
    newStops[index].stop_name = value;
    setStops(newStops);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!routeName.trim()) {
      alert('Please enter a route name');
      return;
    }
    if (stops.some(s => !s.stop_name.trim())) {
      alert('Please fill in all stop names');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await createRoute({
        route_name: routeName,
        is_active: isActive,
        stops: stops
      }, token);
      alert('Route created successfully!');
      navigate('/dashboard/routes/list');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || 'Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/to-dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Add New Route</h1>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/routes/list')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Routes
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Name
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. Route-1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active Route
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Stoppages</h2>
              <button
                type="button"
                onClick={handleAddStop}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Stop
              </button>
            </div>

            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-500">
                    {index + 1}
                  </div>
                  <div className="flex-grow relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={stop.stop_name}
                      onChange={(e) => handleStopChange(index, e.target.value)}
                      placeholder={`Stop ${index + 1} name`}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  {stops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(index)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Route'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
