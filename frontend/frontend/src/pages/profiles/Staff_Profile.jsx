import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Briefcase, MapPin, Bus, Edit2, Save, X, 
  Building, Loader2, Camera, ChevronDown, CheckCircle2, AlertCircle 
} from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { getStaffProfile, updateStaffProfile } from '../../services/staff';
import { getRoutes } from '../../services/transport';
import { getMe } from '../../services/auth';
import { uploadProfilePicture, getProfilePictureUrl } from '../../services/profile';
import defaultProfile from '../../assets/profile.png';

const Staff_Profile = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

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

      if (profileData.has_profile_picture) {
        setAvatarPreview(getProfilePictureUrl(profileData.user_id));
      }
      
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
    // Reset avatar preview if canceled
    setAvatarPreview(null);
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setError('Image size must be less than 2MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);
      
      await uploadProfilePicture(file);
      
      // Update preview immediately
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      setSuccessMessage('Profile picture updated successfully');
      
      // Refresh profile data to ensure sync
      await fetchData();
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        department: formData.department,
        mobile_number: formData.mobile_number,
        default_route_name: formData.default_route_name || null,
        default_pickup_stop_name: formData.default_pickup_stop_name || null,
      };
      
      if (formData.full_name.trim()) {
        payload.full_name = formData.full_name;
      }

      await updateStaffProfile(payload);
      
      // Refresh data
      await fetchData();
      
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
      // Keep avatar preview or clear it depending on logic (here we keep it as if saved)
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
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="h-32 bg-gradient-to-r from-green-800 to-green-300" />
          <div className="px-8 pb-8">
            <div className="relative flex flex-col md:flex-row items-start md:items-end -mt-12 mb-4 gap-6">
              
              {/* Avatar */}
              <div className="relative group">
                <div className="h-28 w-28 rounded-full border-4 border-white bg-gray-200 shadow-md overflow-hidden flex items-center justify-center relative">
                  <img 
                    src={avatarPreview || defaultProfile} 
                    alt="Profile" 
                    className={`h-full w-full object-cover ${uploadingPhoto ? 'opacity-50' : ''}`} 
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Image Upload Overlay */}
                <button 
                  onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent disabled:cursor-not-allowed"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingPhoto}
                />
              </div>

              {/* Header Info */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 truncate">
                      {user?.full_name || 'Staff Member'}
                    </h1>
                  </div>
                  
                  {!isEditing && (
                    <Button 
                      onClick={handleEditClick} 
                      className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 p-1 rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 animate-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="ml-auto hover:bg-green-100 p-1 rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Edit Profile</h2>
              <p className="text-sm text-gray-500">Update your personal information and preferences.</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-8">
              {/* Personal Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-gray-700">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      placeholder="e.g. John Doe"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-gray-700">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      placeholder="e.g. Engineering"
                      value={formData.department}
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile_number" className="text-gray-700">Mobile Number</Label>
                    <Input
                      id="mobile_number"
                      name="mobile_number"
                      placeholder="01XXXXXXXXX"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Transport Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Transport Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default_route_name" className="text-gray-700">Default Route</Label>
                    <div className="relative">
                      <select
                        id="default_route_name"
                        name="default_route_name"
                        value={formData.default_route_name}
                        onChange={handleRouteChange}
                        className="w-full h-11 pl-4 pr-10 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm"
                      >
                        <option value="">Select a route</option>
                        {routes.map(route => (
                          <option key={route.id} value={route.route_name}>
                            {route.route_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_pickup_stop_name" className="text-gray-700">Default Pickup Stop</Label>
                    <div className="relative">
                      <select
                        id="default_pickup_stop_name"
                        name="default_pickup_stop_name"
                        value={formData.default_pickup_stop_name}
                        onChange={handleChange}
                        disabled={!formData.default_route_name}
                        className="w-full h-11 pl-4 pr-10 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="">Select a stop</option>
                        {getStopsForSelectedRoute().map(stop => (
                          <option key={stop.id} value={stop.stop_name}>
                            {stop.stop_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-5 flex items-center justify-end gap-3 border-t border-gray-100">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleCancel} 
                disabled={saving}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm min-w-[140px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Personal Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
                    <User className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Full Name</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{user?.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Staff Code</label>
                      <p className="mt-1 text-lg font-medium text-gray-900 font-mono">{profile?.staff_code || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="h-px bg-gray-50" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Email Address</label>
                      <div className="mt-1 flex items-center gap-2 text-gray-900">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-lg font-medium">{profile?.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Department</label>
                      <div className="mt-1 flex items-center gap-2 text-gray-900">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-lg font-medium">{profile?.department || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact & Transport */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                    <Bus className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Transport & Contact</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Mobile Number</label>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span className="text-lg font-medium text-gray-900">{profile?.mobile_number || 'Not set'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Default Route</label>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">{profile?.default_route_name || 'No route selected'}</p>
                        {profile?.default_route_name && (
                          <p className="text-xs text-gray-500 mt-0.5">Regular Commute</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Pickup Stop</label>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="h-2 w-2 rounded-full bg-primary-500 ml-1.5 mr-1.5" />
                      <span className="text-lg font-medium text-gray-900">{profile?.default_pickup_stop_name || 'No stop selected'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Staff_Profile;
