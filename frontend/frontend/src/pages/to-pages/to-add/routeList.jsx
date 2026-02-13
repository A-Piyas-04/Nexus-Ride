import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Search } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../../components/ui/Button';
import { getRoutes, updateRoute } from '../../../services/routeService';
import DashboardLayout from '../../dashboard/DashboardLayout';
import RouteDetailsModal from './RouteDetailsModal';

export default function RouteList() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const verifyAndFetch = async () => {
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
          return;
        }
        await fetchRoutes();
      } catch (error) {
        console.error('Access verification failed:', error);
        navigate('/dashboard');
      } finally {
        setVerifying(false);
      }
    };
    verifyAndFetch();
  }, [navigate]);

  const fetchRoutes = async () => {
    try {
      const data = await getRoutes();
      setRoutes(data || []);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleActive = async (route) => {
    try {
      const token = localStorage.getItem('token');
      const updatedRoute = await updateRoute(route.id, {
        is_active: !route.is_active
      }, token);
      
      setRoutes(routes.map(r => r.id === route.id ? updatedRoute : r));
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Failed to update route status');
    }
  };

  const filteredRoutes = routes.filter(route => 
    route.route_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRouteClick = (route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleUpdateSuccess = (updatedRoute) => {
    setRoutes(routes.map(r => r.id === updatedRoute.id ? updatedRoute : r));
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/routes/add')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Existing Routes</h1>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/routes/add')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Route
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm font-medium">
                  <th className="px-6 py-4">Route Name</th>
                  <th className="px-6 py-4">Total Stops</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Loading routes...</td>
                  </tr>
                ) : filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">No routes found</td>
                  </tr>
                ) : (
                  filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleRouteClick(route)}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors text-left"
                        >
                          {route.route_name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {route.stops?.length || 0} stops
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleActive(route)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                              route.is_active ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                route.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleRouteClick(route)}
                        >
                          Edit Stops
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedRoute && (
        <RouteDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          route={selectedRoute}
          onUpdate={handleUpdateSuccess}
        />
      )}
    </DashboardLayout>
  );
}
