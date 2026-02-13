import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, MoveUp, MoveDown, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { syncRouteStops } from '../../../services/routeService';

export default function RouteDetailsModal({ isOpen, onClose, route, onUpdate }) {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route && route.stops) {
      // Sort stops by sequence number
      const sortedStops = [...route.stops].sort((a, b) => a.sequence_number - b.sequence_number);
      setStops(sortedStops);
    }
  }, [route]);

  if (!isOpen) return null;

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

  const handleStopNameChange = (index, value) => {
    const newStops = [...stops];
    newStops[index].stop_name = value;
    setStops(newStops);
  };

  const moveStop = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stops.length - 1) return;

    const newStops = [...stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap elements
    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    
    // Update sequence numbers
    const updatedStops = newStops.map((stop, i) => ({
      ...stop,
      sequence_number: i + 1
    }));
    
    setStops(updatedStops);
  };

  const handleSave = async () => {
    if (stops.some(s => !s.stop_name.trim())) {
      setError('All stop names must be filled');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const updatedRoute = await syncRouteStops(route.id, stops.map(s => ({
        stop_name: s.stop_name,
        sequence_number: s.sequence_number
      })), token);
      
      onUpdate(updatedRoute);
      onClose();
    } catch (err) {
      console.error('Failed to sync stops:', err);
      setError(err.response?.data?.detail || 'Failed to update stops. Make sure stop names are unique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{route.route_name}</h2>
            <p className="text-sm text-gray-500">Manage route stoppages and their sequence</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {stops.map((stop, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group transition-all hover:border-primary-200 hover:bg-white"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStop(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveStop(index, 'down')}
                    disabled={index === stops.length - 1}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg font-bold text-primary-600 text-sm">
                    {stop.sequence_number}
                  </span>
                  <input
                    type="text"
                    value={stop.stop_name}
                    onChange={(e) => handleStopNameChange(index, e.target.value)}
                    placeholder="Enter stop name"
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <button
                  onClick={() => handleRemoveStop(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddStop}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Stoppage
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            loading={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
