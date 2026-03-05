import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Edit2, Save, X, 
  Loader2, Camera, CheckCircle2, AlertCircle,
  Car, CreditCard, ShieldCheck
} from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { getMyDriverProfile, updateDriverProfile } from '../../services/auth';
import defaultProfile from '../../assets/profile.png';

const DriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    license_number: '',
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
      if (!token) return;

      const profileData = await getMyDriverProfile(token);
      setProfile(profileData);
      
      // Initialize form data
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        mobile_number: profileData.mobile_number || '',
        license_number: profileData.license_number || '',
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
    
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      mobile_number: profile?.mobile_number || '',
      license_number: profile?.license_number || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
    setAvatarPreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
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

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const emailNorm = (formData.email || '').trim().toLowerCase();
      if (emailNorm && !emailNorm.endsWith('@iut-dhaka.edu')) {
        setError('Email must end with @iut-dhaka.edu');
        setSaving(false);
        return;
      }

      const payload = {
        full_name: formData.full_name,
        email: emailNorm,
        mobile_number: formData.mobile_number,
        license_number: formData.license_number,
      };

      await updateDriverProfile(payload);
      
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
                <div className="h-28 w-28 rounded-full border-4 border-white bg-gray-200 shadow-md overflow-hidden flex items-center justify-center">
                  <img 
                    src={avatarPreview || defaultProfile} 
                    alt="Profile" 
                    className="h-full w-full object-cover" 
                  />
                </div>

                {/* Image Upload Overlay */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {/* Header Info */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 truncate">
                      {profile?.full_name || 'Driver'}
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
              <p className="text-sm text-gray-500">Update your personal and vehicle information.</p>
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
                    <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="e.g. name@iut-dhaka.edu"
                      value={formData.email}
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

              {/* Driver Info Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Driver Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="license_number" className="text-gray-700">License Number</Label>
                    <Input
                      id="license_number"
                      name="license_number"
                      value={formData.license_number}
                      disabled
                      className="h-11 border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed rounded-lg"
                    />
                    <p className="text-xs text-gray-400">License number cannot be changed.</p>
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
                      <p className="mt-1 text-lg font-medium text-gray-900">{profile?.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Mobile Number</label>
                      <div className="mt-1 flex items-center gap-2 text-gray-900">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-lg font-medium">{profile?.mobile_number || 'Not set'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-50" />

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Email Address</label>
                      <div className="mt-1 flex items-center gap-2 text-gray-900">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-lg font-medium">{profile?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Driver Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                    <Car className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Driver Information</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">License Number</label>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <span className="text-lg font-medium text-gray-900">{profile?.license_number || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Approval Status</label>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <ShieldCheck className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          profile?.driver_status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {profile?.driver_status === 1 ? 'Approved' : 'Pending Approval'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wide">Assigned Vehicle</label>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Car className="h-5 w-5 text-gray-500" />
                      <span className="text-lg font-medium text-gray-900">
                        {profile?.assigned_vehicle_number ? `Vehicle ${profile.assigned_vehicle_number}` : 'No vehicle assigned'}
                      </span>
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

export default DriverProfile;
