import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card } from '../../components/ui/Card';
import { createTransportRequest } from '../../services/transport';

export default function TransportRequestForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    event_title: '',
    event_date: '',
    guests: [
      { name: '', pickup_location: '', notes: '' }
    ]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuestChange = (index, field, value) => {
    const updatedGuests = [...formData.guests];
    updatedGuests[index][field] = value;
    setFormData(prev => ({ ...prev, guests: updatedGuests }));
  };

  const addGuest = () => {
    setFormData(prev => ({
      ...prev,
      guests: [...prev.guests, { name: '', pickup_location: '', notes: '' }]
    }));
  };

  const removeGuest = (index) => {
    if (formData.guests.length > 1) {
      const updatedGuests = formData.guests.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, guests: updatedGuests }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.event_title || !formData.event_date) {
      setError('Event title and date are required.');
      setLoading(false);
      return;
    }

    const invalidGuests = formData.guests.some(g => !g.name || !g.pickup_location);
    if (invalidGuests) {
      setError('All guests must have a name and pickup location.');
      setLoading(false);
      return;
    }

    try {
      await createTransportRequest(formData);
      navigate('/dashboard/transport-requests/my');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">New Transport Request</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_title">Event Title</Label>
              <Input
                id="event_title"
                name="event_title"
                placeholder="e.g., AI Workshop"
                value={formData.event_title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date</Label>
              <Input
                id="event_date"
                name="event_date"
                type="date"
                value={formData.event_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Guest List</h2>
            <Button type="button" variant="outline" size="sm" onClick={addGuest}>
              <Plus className="h-4 w-4 mr-2" /> Add Guest
            </Button>
          </div>

          <div className="space-y-4">
            {formData.guests.map((guest, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded-lg bg-gray-50">
                <div className="flex-1 space-y-2 w-full">
                  <Label>Guest Name</Label>
                  <Input
                    placeholder="Guest Name"
                    value={guest.name}
                    onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <Label>Pickup Location</Label>
                  <Input
                    placeholder="Location"
                    value={guest.pickup_location}
                    onChange={(e) => handleGuestChange(index, 'pickup_location', e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Special requirements"
                    value={guest.notes}
                    onChange={(e) => handleGuestChange(index, 'notes', e.target.value)}
                  />
                </div>
                {formData.guests.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-8"
                    onClick={() => removeGuest(index)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}
