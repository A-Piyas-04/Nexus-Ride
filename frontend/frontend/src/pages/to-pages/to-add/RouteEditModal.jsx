import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { syncRouteStops } from '../../../services/transport';

export default function RouteEditModal({ isOpen, onClose, route, onUpdate }) {
  const [stoppages, setStoppages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (route && route.stops) {
      setStoppages(
        [...route.stops]
          .sort((a, b) => a.sequence_number - b.sequence_number)
          .map(s => ({ ...s, tempId: s.id }))
      );
    } else {
      setStoppages([]);
    }
  }, [route]);

  const handleAddStoppage = () => {
    setStoppages([
      ...stoppages,
      { tempId: Date.now(), stop_name: '', sequence_number: stoppages.length + 1 }
    ]);
  };

  const handleRemoveStoppage = (tempId) => {
    const updated = stoppages
      .filter((s) => s.tempId !== tempId)
      .map((s, index) => ({ ...s, sequence_number: index + 1 }));
    setStoppages(updated);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newStoppages = [...stoppages];
    [newStoppages[index - 1], newStoppages[index]] = [newStoppages[index], newStoppages[index - 1]];
    const reordered = newStoppages.map((s, i) => ({ ...s, sequence_number: i + 1 }));
    setStoppages(reordered);
  };

  const handleMoveDown = (index) => {
    if (index === stoppages.length - 1) return;
    const newStoppages = [...stoppages];
    [newStoppages[index], newStoppages[index + 1]] = [newStoppages[index + 1], newStoppages[index]];
    const reordered = newStoppages.map((s, i) => ({ ...s, sequence_number: i + 1 }));
    setStoppages(reordered);
  };

  const handleNameChange = (tempId, value) => {
    setStoppages(stoppages.map(s => s.tempId === tempId ? { ...s, stop_name: value } : s));
  };

  const handleSave = async () => {
    if (stoppages.some(s => !s.stop_name.trim())) {
      setError('All stoppage names are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = stoppages.map(s => ({
        stop_name: s.stop_name,
        sequence_number: s.sequence_number
      }));
      const updatedRoute = await syncRouteStops(route.id, payload);
      onUpdate(updatedRoute);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update stoppages');
    } finally {
      setLoading(false);
    }
  };

  if (!route) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="Edit Stoppages" description={route.route_name}>
      <div className="p-6">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mb-6">
          {stoppages.map((stop, index) => (
            <div key={stop.tempId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-6 text-xs font-bold text-gray-400 text-center">
                {stop.sequence_number}
              </div>
              <div className="flex-1">
                <Input
                  value={stop.stop_name}
                  onChange={(e) => handleNameChange(stop.tempId, e.target.value)}
                  placeholder="Stop name"
                  className="bg-white h-9"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === stoppages.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveStoppage(stop.tempId)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-dashed"
            onClick={handleAddStoppage}
          >
            <Plus className="h-4 w-4" />
            Add Stoppage
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
