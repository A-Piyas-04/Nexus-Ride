import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle } from 'lucide-react';
import { driverSignup } from '../services/auth';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('staff');
  const [mobile, setMobile] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [mobileValid, setMobileValid] = useState(true);
  const [localError, setLocalError] = useState(null);
  const { signup, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'staff') {
        await signup(fullName, email, password);
        localStorage.setItem('auth_mode', 'staff');
      } else {
        const mm = (mobile || '').trim();
        const valid = mm.length === 11 && /^\d+$/.test(mm) && mm.startsWith('01');
        setMobileValid(valid);
        if (!valid) {
          const msg = 'Invalid phone number';
          window.alert(msg);
          setLocalError(msg);
          return;
        }
        if (!licenseNumber) {
          const msg = 'Driver licence is required';
          window.alert(msg);
          setLocalError(msg);
          return;
        }
        try {
          await driverSignup({
            full_name: fullName,
            mobile_number: mm,
            password,
            license_number: licenseNumber,
          });
        } catch (err) {
          const detail = err?.response?.data?.detail || 'Signup failed';
          window.alert(detail);
          setLocalError(detail);
          return;
        }
        localStorage.setItem('auth_mode', 'driver');
      }
      navigate('/login');
    } catch {
      return;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        <CardDescription className="text-center">
          Enter your information to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant={mode === 'staff' ? 'primary' : 'secondary'}
              onClick={(e) => {
                e.preventDefault();
                setMode('staff');
              }}
            >
              Staff
            </Button>
            <Button
              variant={mode === 'driver' ? 'primary' : 'secondary'}
              onClick={(e) => {
                e.preventDefault();
                setMode('driver');
              }}
            >
              Driver
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="John Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {mode === 'staff' ? (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@iut-dhaka.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">Use your @iut-dhaka.edu email</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="mobile">Phone Number</Label>
              <Input
                id="mobile"
                placeholder="01*********"
                required
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  const mm = e.target.value.trim();
                  const valid = mm.length === 11 && /^\d+$/.test(mm) && mm.startsWith('01');
                  setMobileValid(valid);
                }}
                className={mobileValid ? '' : 'bg-red-50 border-red-300'}
              />
              <p className="text-xs text-gray-500">enter a valid Bangladeshi phone number. Example: 01*********</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
            />
            <p className="text-xs text-gray-500">Must be at least 8 characters</p>
          </div>
          {mode === 'driver' && (
            <div className="space-y-2">
              <Label htmlFor="license">Driver licence</Label>
              <Input
                id="license"
                placeholder="DL-XXXX"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>
          )}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {localError && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle size={16} />
              <span>{localError}</span>
            </div>
          )}
          <Button type="submit" className="w-full" isLoading={loading}>
            Sign Up
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
