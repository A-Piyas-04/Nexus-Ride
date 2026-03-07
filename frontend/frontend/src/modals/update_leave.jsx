import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, Edit2, Save, X } from 'lucide-react';
import { getMyLeaves, deleteLeave } from '../services/auth';

export default function UpdateLeaveModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ from_date: '', to_date: '' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadLeaves = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMyLeaves(token);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load leave periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setEditingId(null);
      setEditForm({ from_date: '', to_date: '' });
      loadLeaves();
    }
  }, [open]);

  const beginEdit = (leave) => {
    setEditingId(leave.id);
    setEditForm({
      from_date: String(leave.from_date).slice(0, 10),
      to_date: String(leave.to_date).slice(0, 10),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ from_date: '', to_date: '' });
  };

  const confirmEdit = async () => {
    if (!editingId || !editForm.from_date || !editForm.to_date) return;
    if (editForm.from_date > editForm.to_date) {
      setError('From date must be on or before to date.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/subscription/leave/${editingId}`,
        { from_date: editForm.from_date, to_date: editForm.to_date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadLeaves();
      cancelEdit();
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to update leave';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const removeLeave = async (id) => {
    if (!token) return;
    try {
      await deleteLeave(id, token);
      await loadLeaves();
    } catch {
      setError('Failed to cancel leave');
    }
  };

  if (!open) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      onClick={onBackdrop}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-8"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-2xl">
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-start">
            <CardTitle>Update Leave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : null}
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : leaves.length === 0 ? (
              <div className="text-sm text-gray-600">No leave periods added yet.</div>
            ) : (
              <ul className="space-y-3">
                {leaves.map((leave) => {
                  const isEditing = editingId === leave.id;
                  return (
                    <li key={leave.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          {!isEditing ? (
                            <div className="text-sm font-medium text-gray-900">
                              {String(leave.from_date).slice(0, 10)} to {String(leave.to_date).slice(0, 10)}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={editForm.from_date}
                                onChange={(e) => setEditForm({ ...editForm, from_date: e.target.value })}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                              />
                              <span className="text-sm text-gray-600">to</span>
                              <input
                                type="date"
                                value={editForm.to_date}
                                onChange={(e) => setEditForm({ ...editForm, to_date: e.target.value })}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          {!isEditing ? (
                            <>
                              <Button variant="secondary" onClick={() => beginEdit(leave)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit leave duration
                              </Button>
                              <Button
                                variant="secondary"
                                className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                onClick={() => removeLeave(leave.id)}
                              >
                                Cancel leave
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button onClick={confirmEdit}>
                                <Save className="h-4 w-4 mr-2" />
                                Confirm
                              </Button>
                              <Button variant="secondary" onClick={cancelEdit}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
