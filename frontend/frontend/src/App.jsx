import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TODashboard from './pages/dashboard/TODashboard';
import SubscriberDashboardPage from './pages/dashboard/SubscriberDashboardPage';
import SeatAvailabilityPage from './pages/SeatAvailabilityPage';
import TokenHistoryPage from './pages/TokenHistoryPage';
import Transition, { DEFAULT_DURATION_MS } from './components/ui/Transition';

function AppRoutes() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [displayLocation, setDisplayLocation] = React.useState(location);
  const [open, setOpen] = React.useState(true);
  const [direction, setDirection] = React.useState('forward');

  React.useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;
    setDirection(navigationType === 'POP' ? 'backward' : 'forward');
    setOpen(false);
    const timeout = window.setTimeout(() => {
      setDisplayLocation(location);
      setOpen(true);
    }, DEFAULT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [location, navigationType, displayLocation.pathname]);

  const exitClassName =
    direction === 'backward' ? 'opacity-0 -translate-y-4' : 'opacity-0 translate-y-4';

  return (
    <Transition
      open={open}
      enterClassName="opacity-100 translate-y-0"
      exitClassName={exitClassName}
      className="min-h-screen"
    >
      <Routes location={displayLocation}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/to-dashboard" element={<TODashboard />} />
        <Route path="/subscriber" element={<SubscriberDashboardPage />} />
        <Route path="/seat-availability" element={<SeatAvailabilityPage />} />
        <Route path="/token-history" element={<TokenHistoryPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Transition>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
