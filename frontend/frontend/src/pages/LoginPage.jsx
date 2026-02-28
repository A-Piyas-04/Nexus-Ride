import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle } from 'lucide-react';
import { getSubscription } from '../services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('staff');
  const [mobile, setMobile] = useState('');
  const [mobileValid, setMobileValid] = useState(true);
  const [localError, setLocalError] = useState(null);
  const { login, driverLogin, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    clearError();
    const m = typeof window !== 'undefined' ? localStorage.getItem('auth_mode') : null;
    if (m === 'driver') setMode('driver');
    setLocalError(null);
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let token = null;
      if (mode === 'staff') {
        const data = await login(email, password);
        token = data?.access_token || localStorage.getItem('token');
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
        let data;
        try {
          data = await driverLogin(mm, password);
        } catch {
          return;
        }
        token = data?.access_token;
      }

      if (email === 'transportofficer@iut-dhaka.edu') {
        navigate('/to-dashboard');
        return;
      }

      if (token) {
        if (mode === 'driver') {
          navigate('/driver-dashboard');
          return;
        } else {
          const subscription = await getSubscription(token).catch(() => null);
          if (subscription && subscription.status === 'ACTIVE') {
            navigate('/subscriber');
            return;
          }
        }
      }

      navigate('/dashboard');
    } catch {
      return;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Enter your email to sign in to your account
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
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
            Sign In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
