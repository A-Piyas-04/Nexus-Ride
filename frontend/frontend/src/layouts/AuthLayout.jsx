import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-900">NexusRide</h1>
          <p className="text-gray-600 mt-2">Your ride, your way.</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
