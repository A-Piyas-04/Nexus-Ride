import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="mb-6 text-gray-600">
          Welcome back, <span className="font-semibold">{user?.email || 'User'}</span>!
        </p>
        <Button onClick={logout} variant="outline" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
