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
import SubscriptionRequestsPage from './pages/request/SubscriptionRequestsPage';
import SeatAvailabilityPage from './pages/SeatAvailabilityPage';
import TokenHistoryPage from './pages/TokenHistoryPage';
import Profile from './pages/Profile';
import BuyToken from './pages/BuyToken';
import TransportRequestForm from './pages/request/TransportRequestForm';
import { FacultyRequestsList } from './pages/request/FacultyRequests';
import RequestDetailPage from './pages/request/RequestDetailPage';
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
          <Route path="/subscription-requests" element={<SubscriptionRequestsPage />} />
        <Route path="/seat-availability" element={<SeatAvailabilityPage />} />
        <Route path="/token-history" element={<TokenHistoryPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/buy-token" element={<BuyToken />} />
        
        {/* Faculty Transport Routes */}
        <Route path="/dashboard/transport-requests/new" element={<TransportRequestForm />} />
        <Route path="/dashboard/transport-requests/my" element={<FacultyRequestsList />} />
        <Route path="/dashboard/transport-requests/:id" element={<RequestDetailPage />} />
        
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
