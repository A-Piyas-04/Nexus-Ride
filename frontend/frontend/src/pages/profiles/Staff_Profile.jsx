import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';

const API_URL = 'http://localhost:8000';
const DEPARTMENTS = ['CSE', 'EEE', 'MPE', 'CEE', 'BTM'];
const UI_ROUTES = ['route 1', 'route 2'];
// Stops will be fetched from backend per selected route

const toBackendRoute = (name) => {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('route 1')) return 'Route-1';
  if (n.includes('route 2')) return 'Route-2';
  return null;
};

const fromBackendRoute = (routeName) => {
  if (!routeName) return '';
  if (routeName === 'Route-1') return 'route 1';
  if (routeName === 'Route-2') return 'route 2';
  return '';
};

export default function Staff_Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [routesData, setRoutesData] = useState([]);
  const [stopsOptions, setStopsOptions] = useState([]);

  const [originalData, setOriginalData] = useState({
    name: '',
    id: '',
    staffCode: '',
    email: '',
    department: '',
    mobileNumber: '',
    defaultRoute: '',
    defaultPickupStop: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    mobileNumber: '',
    defaultRoute: '',
    defaultPickupStop: '',
  });

  const isValidMobile = useMemo(() => {
    const n = (formData.mobileNumber || '').trim();
    return /^\d{11}$/.test(n) && n.startsWith('01');
  }, [formData.mobileNumber]);

  const isFormComplete = useMemo(() => {
    return Boolean(
      (formData.name || '').trim() &&
      (formData.department || '').trim() &&
      (formData.defaultRoute || '').trim() &&
      (formData.defaultPickupStop || '').trim() &&
      isValidMobile
    );
  }, [formData, isValidMobile]);

  const hasChanges = useMemo(() => {
    return (
      formData.name !== originalData.name ||
      formData.department !== originalData.department ||
      formData.mobileNumber !== originalData.mobileNumber ||
      formData.defaultRoute !== originalData.defaultRoute ||
      formData.defaultPickupStop !== originalData.defaultPickupStop
    );
  }, [formData, originalData]);

  const handleChange = (key) => (e) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch available routes with stops
      let routes = [];
      try {
        const routesRes = await axios.get(`${API_URL}/routes`, { headers });
        routes = routesRes.data || [];
      } catch {
        routes = [];
      }
      setRoutesData(routes);

      const meRes = await axios.get(`${API_URL}/auth/me`, { headers });
      const me = meRes.data || {};

      let staff = null;
      try {
        const staffRes = await axios.get(`${API_URL}/staff/profile/me`, { headers });
        staff = staffRes.data || null;
      } catch {
        staff = null;
      }

      const initial = {
        name: me.full_name || '',
        id: me.id || '',
        staffCode: staff?.staff_code || '',
        email: me.email || '',
        department: staff?.department || '',
        mobileNumber: staff?.mobile_number || me?.mobile_number || '',
        defaultRoute: fromBackendRoute(staff?.default_route_name) || '',
        defaultPickupStop: staff?.default_pickup_stop_name || '',
      };

      // Populate stopsOptions based on initial route
      const backendRouteName = toBackendRoute(initial.defaultRoute);
      if (backendRouteName) {
        const routeEntry = routes.find((r) => r.route_name === backendRouteName);
        if (routeEntry?.stops?.length) {
          setStopsOptions(routeEntry.stops.map((s) => s.stop_name));
        } else {
          setStopsOptions([]);
        }
      } else {
        setStopsOptions([]);
      }

      setOriginalData(initial);
      setFormData({
        name: initial.name,
        department: initial.department,
        mobileNumber: initial.mobileNumber,
        defaultRoute: initial.defaultRoute,
        defaultPickupStop: initial.defaultPickupStop,
      });
    } catch (e) {
      setError('Unable to load profile information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When route changes, update stops options from backend data
  useEffect(() => {
    const backendRouteName = toBackendRoute(formData.defaultRoute);
    if (!backendRouteName || routesData.length === 0) {
      setStopsOptions([]);
      return;
    }
    const routeEntry = routesData.find((r) => r.route_name === backendRouteName);
    if (routeEntry?.stops?.length) {
      const options = routeEntry.stops.map((s) => s.stop_name);
      setStopsOptions(options);
      // If current pickup stop no longer valid, reset
      if (!options.includes(formData.defaultPickupStop)) {
        setFormData((prev) => ({ ...prev, defaultPickupStop: '' }));
      }
    } else {
      setStopsOptions([]);
    }
  }, [formData.defaultRoute, routesData]);

  const handlePrimaryAction = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }
    if (!hasChanges) return;
    if (!isFormComplete) {
      setError('Please fill all fields. Phone must be 11 digits and start with 01.');
      try { window.alert('Please fill all fields. Phone must be 11 digits and start with 01.'); } catch {}
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        full_name: formData.name,
        department: formData.department,
        mobile_number: formData.mobileNumber,
        default_route_name: toBackendRoute(formData.defaultRoute),
        default_pickup_stop_name: formData.defaultPickupStop,
      };

      await axios.put(`${API_URL}/staff/profile`, payload, { headers });

      setOriginalData({
        ...originalData,
        name: formData.name,
        department: formData.department,
        mobileNumber: formData.mobileNumber,
        defaultRoute: formData.defaultRoute,
        defaultPickupStop: formData.defaultPickupStop,
      });
      setEditMode(false);
      setSuccess('Profile updated successfully');
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to save changes';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full px-4 py-8 md:px-8 md:py-10">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Staff Profile</h1>
            <p className="text-gray-600 text-sm">View and manage your profile information</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Dashboard</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Information</CardTitle>
            <Button
              onClick={handlePrimaryAction}
              disabled={saving || (editMode && (!hasChanges || !isFormComplete))}
            >
              {editMode
                ? hasChanges
                  ? 'Confirm updated info'
                  : 'Update info'
                : 'Update info'}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}
            {success ? <div className="mb-4 text-sm text-green-600">{success}</div> : null}
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Enter your name"
                    disabled={!editMode}
                    required
                  />
                </div>

                {/* Removed User ID box per request */}

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    value={formData.department}
                    onChange={handleChange('department')}
                    disabled={!editMode}
                    required
                  >
                    <option value="" disabled>Select a department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="mobileNumber">Phone Number</Label>
                  <Input
                    id="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange('mobileNumber')}
                    placeholder="01XXXXXXXXX"
                    disabled={!editMode}
                    required
                  />
                  {editMode && formData.mobileNumber && !isValidMobile ? (
                    <span className="text-xs text-red-600">
                      Phone must be 11 digits and start with 01.
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={originalData.email} disabled />
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="defaultRoute">Default Route</Label>
                  <select
                    id="defaultRoute"
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    value={formData.defaultRoute}
                    onChange={handleChange('defaultRoute')}
                    disabled={!editMode}
                    required
                  >
                    <option value="" disabled>Select a route</option>
                    {UI_ROUTES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="defaultPickupStop">Default Pickup Stop</Label>
                  <select
                    id="defaultPickupStop"
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    value={formData.defaultPickupStop}
                    onChange={handleChange('defaultPickupStop')}
                    disabled={!editMode}
                    required
                  >
                    <option value="" disabled>Select a pickup stop</option>
                    {stopsOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="staffCode">Staff Code</Label>
                  <Input id="staffCode" value={originalData.staffCode} disabled />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
