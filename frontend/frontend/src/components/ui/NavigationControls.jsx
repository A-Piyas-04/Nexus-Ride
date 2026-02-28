import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './Button';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export function NavigationControls() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userEmail } = useCurrentUser();

  // Determine if we are on the login or signup page to potentially adjust behavior or visibility
  // The requirement says "every page", so we show it everywhere.
  
  const handleBack = () => {
    if (location.key !== 'default') {
        navigate(-1);
    } else {
        // If no history, maybe go to home? or do nothing?
        // Fallback to home if no history is a safe bet, or just -1 which might do nothing.
        navigate(-1);
    }
  };

  const handleHome = () => {
    // If not logged in, go to login
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }

    // Role-based redirection logic
    // Check for Transport Officer
    // ONLY role_id 3 is Transport Officer. Role 1 might be Staff/User which should NOT be redirected here.
    if (userEmail === 'transportofficer@iut-dhaka.edu' || user?.roles?.some(r => r.id === 3)) {
       navigate('/to-dashboard');
       return;
    }
    
    // Check for Driver
    if (user?.user_type === 'DRIVER' || user?.roles?.some(r => r.name === 'DRIVER')) {
        navigate('/driver-dashboard');
        return;
    }

    // Default to student/staff dashboard
    navigate('/dashboard');
  };

  return (
    <div className="fixed bottom-6 right-6 flex gap-3 z-50 print:hidden">
      <Button
        onClick={handleBack}
        variant="secondary"
        className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl border-primary-100 bg-white/90 backdrop-blur-sm"
        title="Go Back"
        aria-label="Go Back"
      >
        <ArrowLeft className="w-5 h-5 text-primary-700" />
      </Button>
      
      <Button
        onClick={handleHome}
        variant="primary"
        className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all duration-200"
        title="Go Home"
        aria-label="Go Home"
      >
        <Home className="w-5 h-5" />
      </Button>
    </div>
  );
}
