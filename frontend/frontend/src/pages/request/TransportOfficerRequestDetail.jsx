import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MapPin, Truck, MessageSquare, Check, X, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { 
  getTransportRequestById, 
  updateTransportRequestStatus, 
  assignTransportRequest,
  getVehicles,
  getDrivers
} from '../../services/transport';

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

export default function TransportOfficerRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data for assignment
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // Form states
  const [actionNote, setActionNote] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [assignNote, setAssignNote] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch request details first
      const reqData = await getTransportRequestById(id);
      setRequest(reqData);
      
      // If needed (e.g. status is APPROVED), fetch vehicles/drivers
      // We can fetch them always for simplicity or conditionally
      try {
          const [vehiclesData, driversData] = await Promise.all([
            getVehicles(),
            getDrivers()
          ]);
          setVehicles(vehiclesData);
          setDrivers(driversData);
      } catch (e) {
          console.warn("Could not fetch vehicles/drivers", e);
      }

    } catch (err) {
      setError('Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this request?`)) return;
    try {
      const updated = await updateTransportRequestStatus(id, newStatus, actionNote);
      setRequest(updated);
      alert(`Request ${newStatus} successfully.`);
      setActionNote('');
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleAssign = async () => {
    if (!selectedVehicle || !selectedDriver) {
      alert('Please select both vehicle and driver.');
      return;
    }
    try {
      const assignmentData = {
        assigned_vehicle_id: selectedVehicle,
        assigned_driver_profile_id: parseInt(selectedDriver),
        to_reply_message: assignNote
      };
      const updated = await assignTransportRequest(id, assignmentData);
      setRequest(updated);
      alert('Vehicle and driver assigned successfully.');
    } catch (err) {
      alert('Failed to assign.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!request) return <div className="p-8 text-center">Request not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/transport-requests/manage')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Manage Request</h1>
      </div>

      <Card className="p-6 space-y-6">
        {/* Header Details */}
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

        {/* Guest List */}
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
                    {guest.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary-600" /> Transport Office Actions
          </h3>

          {/* PENDING ACTIONS */}
          {request.status === 'PENDING' && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700">Add a Note (Optional)</label>
              <textarea 
                className="w-full p-2 border rounded-md" 
                rows="2"
                placeholder="Reason for approval or rejection..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
              <div className="flex gap-3">
                <Button onClick={() => handleStatusUpdate('APPROVED')} className="bg-green-600 hover:bg-green-700 text-white">
                  <Check className="h-4 w-4 mr-2" /> Approve Request
                </Button>
                <Button onClick={() => handleStatusUpdate('DECLINED')} className="bg-red-600 hover:bg-red-700 text-white">
                  <X className="h-4 w-4 mr-2" /> Decline Request
                </Button>
              </div>
            </div>
          )}

          {/* APPROVED ACTIONS (ASSIGNMENT) */}
          {request.status === 'APPROVED' && (
             <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-900">Assign Vehicle & Driver</h4>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
                        <select 
                            className="w-full p-2 border rounded-md bg-white"
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                        >
                            <option value="">-- Choose Vehicle --</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.vehicle_number} ({v.capacity} seats)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
                        <select 
                            className="w-full p-2 border rounded-md bg-white"
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                        >
                            <option value="">-- Choose Driver --</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.full_name} ({d.license_number})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message to Faculty (Optional)</label>
                    <textarea 
                        className="w-full p-2 border rounded-md" 
                        rows="2"
                        placeholder="e.g. Please be ready at 9 AM..."
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                    />
                </div>
                <Button onClick={handleAssign} className="w-full md:w-auto">
                    Confirm Assignment
                </Button>
             </div>
          )}

          {/* ASSIGNED INFO */}
          {request.status === 'ASSIGNED' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center text-green-800 font-semibold mb-2">
                      <Check className="h-5 w-5 mr-2" /> Assignment Complete
                  </div>
                  <div className="grid gap-2 text-sm text-green-900">
                      <p><span className="font-medium">Vehicle ID:</span> {request.assigned_vehicle_id}</p>
                      <p><span className="font-medium">Driver Profile ID:</span> {request.assigned_driver_profile_id}</p>
                      {request.to_reply_message && <p><span className="font-medium">Note:</span> {request.to_reply_message}</p>}
                  </div>
                  <div className="mt-4">
                       <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusUpdate('COMPLETED')}
                       >
                           Mark as Completed
                       </Button>
                  </div>
              </div>
          )}
          
          {/* COMPLETED/DECLINED INFO */}
          {(request.status === 'COMPLETED' || request.status === 'DECLINED') && (
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 italic">
                  This request is {request.status.toLowerCase()} and can no longer be modified.
              </div>
          )}
        </div>
      </Card>
    </div>
  );
}