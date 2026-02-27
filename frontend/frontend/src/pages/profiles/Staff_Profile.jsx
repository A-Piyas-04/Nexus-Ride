import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, MapPin, Bus, Edit2, Save, X, Building, Loader2 } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { getStaffProfile, updateStaffProfile } from '../../services/staff';
import { getRoutes } from '../../services/transport';
import { getMe } from '../../services/auth';

const Staff_Profile = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    mobile_number: '',
    default_route_name: '',
    default_pickup_stop_name: '',
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [profileData, routesData, userData] = await Promise.all([
        getStaffProfile(),
        getRoutes(),
        getMe(token)
      ]);
      
      setProfile(profileData);
      setRoutes(routesData);
      setUser(userData);
      
      // Initialize form data
      setFormData({
        full_name: userData.full_name || '',
        department: profileData.department || '',
        mobile_number: profileData.mobile_number || '',
        default_route_name: profileData.default_route_name || '',
        default_pickup_stop_name: profileData.default_pickup_stop_name || '',
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
    
    setFormData({
      full_name: user?.full_name || '',
      department: profile?.department || '',
      mobile_number: profile?.mobile_number || '',
      default_route_name: profile?.default_route_name || '',
      default_pickup_stop_name: profile?.default_pickup_stop_name || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRouteChange = (e) => {
    const routeName = e.target.value;
    setFormData(prev => ({
      ...prev,
      default_route_name: routeName,
      default_pickup_stop_name: '' // Reset stop when route changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Filter out empty strings if they shouldn't be sent?
      // The backend handles None, but empty strings might be treated as values.
      // department and mobile_number are strings.
      
      const payload = {
        department: formData.department,
        mobile_number: formData.mobile_number,
        default_route_name: formData.default_route_name || null,
        default_pickup_stop_name: formData.default_pickup_stop_name || null,
      };
      
      // Only include full_name if it's provided (since we might not have pre-filled it)
      if (formData.full_name.trim()) {
        payload.full_name = formData.full_name;
      }

      await updateStaffProfile(payload);
      
      // Refresh data
      await fetchData();
      
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Helper to get stops for selected route
  const getStopsForSelectedRoute = () => {
    const selectedRoute = routes.find(r => r.route_name === formData.default_route_name);
    return selectedRoute ? selectedRoute.stops : [];
  };

  if (loading && !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your personal information and transport preferences</p>
          </div>
          {!isEditing && (
            <Button onClick={handleEditClick} className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
            <X className="h-4 w-4" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
            <Save className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your basic personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500">Leave empty to keep current name</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      placeholder="e.g. CSE, EEE"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary-600" />
                  Contact Information
                </CardTitle>
                <CardDescription>How we can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <Input
                    id="mobile_number"
                    name="mobile_number"
                    placeholder="01XXXXXXXXX"
                    value={formData.mobile_number}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary-600" />
                  Transport Preferences
                </CardTitle>
                <CardDescription>Set your default route and pickup point</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_route_name">Default Route</Label>
                    <select
                      id="default_route_name"
                      name="default_route_name"
                      value={formData.default_route_name}
                      onChange={handleRouteChange}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select a route</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.route_name}>
                          {route.route_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_pickup_stop_name">Default Pickup Stop</Label>
                    <select
                      id="default_pickup_stop_name"
                      name="default_pickup_stop_name"
                      value={formData.default_pickup_stop_name}
                      onChange={handleChange}
                      disabled={!formData.default_route_name}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a stop</option>
                      {getStopsForSelectedRoute().map(stop => (
                        <option key={stop.id} value={stop.stop_name}>
                          {stop.stop_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-600" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-2 rounded-full">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-base font-semibold text-gray-900">{user?.full_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-2 rounded-full">
                    <Briefcase className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Staff Code</p>
                    <p className="text-base font-semibold text-gray-900">{profile?.staff_code || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-2 rounded-full">
                    <Building className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-base font-semibold text-gray-900">{profile?.department || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-base font-semibold text-gray-900">{profile?.email || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary-600" />
                  Contact & Transport
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mobile Number</p>
                    <p className="text-base font-semibold text-gray-900">{profile?.mobile_number || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-2 rounded-full">
                    <Bus className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Default Route</p>
                    <p className="text-base font-semibold text-gray-900">{profile?.default_route_name || 'Not selected'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Default Pickup Stop</p>
                    <p className="text-base font-semibold text-gray-900">{profile?.default_pickup_stop_name || 'Not selected'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Staff_Profile;
