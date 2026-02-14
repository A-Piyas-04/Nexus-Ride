import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowUp, ArrowDown, MapPin, Save, List } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Label } from '../../../components/ui/Label';
import DashboardLayout from '../../dashboard/DashboardLayout';
import { createRoute } from '../../../services/transport';

export default function RouteAdd() {
  const navigate = useNavigate();
  const [routeName, setRouteName] = useState('');
  const [stoppages, setStoppages] = useState([
    { id: Date.now(), stop_name: '', sequence_number: 1 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddStoppage = () => {
    setStoppages([
      ...stoppages,
      { id: Date.now(), stop_name: '', sequence_number: stoppages.length + 1 }
    ]);
  };

  const handleRemoveStoppage = (id) => {
    if (stoppages.length === 1) return;
    const updatedStoppages = stoppages
      .filter((s) => s.id !== id)
      .map((s, index) => ({ ...s, sequence_number: index + 1 }));
    setStoppages(updatedStoppages);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newStoppages = [...stoppages];
    [newStoppages[index - 1], newStoppages[index]] = [newStoppages[index], newStoppages[index - 1]];
    
    // Update sequence numbers
    const reordered = newStoppages.map((s, i) => ({ ...s, sequence_number: i + 1 }));
    setStoppages(reordered);
  };

  const handleMoveDown = (index) => {
    if (index === stoppages.length - 1) return;
    const newStoppages = [...stoppages];
    [newStoppages[index], newStoppages[index + 1]] = [newStoppages[index + 1], newStoppages[index]];
    
    // Update sequence numbers
    const reordered = newStoppages.map((s, i) => ({ ...s, sequence_number: i + 1 }));
    setStoppages(reordered);
  };

  const handleStoppageNameChange = (id, value) => {
    setStoppages(stoppages.map(s => s.id === id ? { ...s, stop_name: value } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!routeName.trim()) {
      setError('Route name is required');
      return;
    }

    if (stoppages.some(s => !s.stop_name.trim())) {
      setError('All stoppage names are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        route_name: routeName,
        is_active: true,
        stops: stoppages.map(s => ({
          stop_name: s.stop_name,
          sequence_number: s.sequence_number
        }))
      };

      await createRoute(payload);
      navigate('/to-pages/to-add/routeList'); 
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Route</h1>
            <p className="text-gray-600">Define a new transport route with sequential stoppages</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/to-pages/to-add/routeList')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Routes
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="routeName">Route Name</Label>
                <Input
                  id="routeName"
                  placeholder="e.g. Route-1 (Tongi - Farmgate)"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Sequential Stoppages
              </h2>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddStoppage}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Stop
              </Button>
            </div>

            <div className="space-y-3">
              {stoppages.map((stoppage, index) => (
                <div 
                  key={stoppage.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex flex-col items-center justify-center text-xs font-bold text-gray-400 w-6">
                    {stoppage.sequence_number}
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      placeholder={`Stoppage ${index + 1} name`}
                      value={stoppage.stop_name}
                      onChange={(e) => handleStoppageNameChange(stoppage.id, e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === stoppages.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStoppage(stoppage.id)}
                      disabled={stoppages.length === 1}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Route'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
