import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Search, ToggleLeft, ToggleRight, Loader2, Edit3 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import DashboardLayout from '../../dashboard/DashboardLayout';
import { getRoutes, updateRoute } from '../../../services/transport';
import RouteEditModal from './RouteEditModal';

export default function RouteList() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchRoutes = async () => {
    try {
      const data = await getRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleToggleActive = async (route) => {
    setTogglingId(route.id);
    try {
      const updated = await updateRoute(route.id, { is_active: !route.is_active });
      setRoutes(routes.map(r => r.id === route.id ? updated : r));
    } catch (error) {
      console.error('Failed to toggle route status:', error);
      alert('Failed to update route status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenModal = (route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleRouteUpdate = (updatedRoute) => {
    setRoutes(routes.map(r => r.id === updatedRoute.id ? updatedRoute : r));
  };

  const filteredRoutes = routes.filter(route => 
    route.route_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Routes</h1>
            <p className="text-gray-600">View and manage all available transport routes</p>
          </div>
          <Button 
            onClick={() => navigate('/to-pages/to-add/routeAdd')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Route
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search routes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No routes found</h3>
            <p className="text-gray-500 mb-6">Start by creating your first transport route.</p>
            <Button onClick={() => navigate('/to-pages/to-add/routeAdd')} variant="outline">
              Create Route
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Route Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Stops</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenModal(route)}
                        className="font-bold text-gray-900 hover:text-primary-600 transition-colors text-left flex items-center gap-2"
                      >
                        {route.route_name}
                        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {route.stops?.length || 0} stops
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleActive(route)}
                          disabled={togglingId === route.id}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            route.is_active 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {togglingId === route.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : route.is_active ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                          {route.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(route)}
                        className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        Edit Stops
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <RouteEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          route={selectedRoute}
          onUpdate={handleRouteUpdate}
        />
      </div>
    </DashboardLayout>
  );
}
