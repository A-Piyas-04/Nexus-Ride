import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [preview, setPreview] = React.useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <section className="w-full px-4 py-8 md:px-8 md:py-10">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-gray-600 text-sm">View and manage your user profile</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden border border-gray-300 shadow-sm">
                  {preview ? (
                    <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
                      Upload photo
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <Label htmlFor="profile_photo" className="sr-only">
                    Profile Photo
                  </Label>
                  <Input id="profile_photo" type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <Button className="mt-3" variant="secondary">Upload</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Staff Code</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Default Route ID</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Default Pickup Stop ID</p>
                  <p className="text-sm font-medium text-gray-900">—</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
