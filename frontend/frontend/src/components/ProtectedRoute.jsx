import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check roles (role.id === 3 is TO, role.id === 1 is Admin/SuperUser often, but following user's strict requirement)
  // user.roles is expected to be an array of objects like { id: number, name: string }
  const hasRequiredRole = requiredRoles.length === 0 || 
    user.roles?.some(role => requiredRoles.includes(role.id));

  if (!hasRequiredRole) {
    // Redirect to unauthorized or back to dashboard if they don't have the role
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
