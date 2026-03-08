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
import NotificationsPage from './pages/NotificationsPage';
import Staff_Profile from './pages/profiles/Staff_Profile';
import DriverProfile from './pages/profiles/driver_profile';
import BuyToken from './pages/BuyToken';
import DriverRequestsPage from './pages/request/driverRequests';
import DriverDashboard from './pages/dashboard/DriverDashboard';
import DriverAllTripsPage from './pages/dashboard/DriverAllTripsPage';
import DriverPassengerListPage from './pages/dashboard/DriverPassengerListPage';
import TransportRequestForm from './pages/request/TransportRequestForm';
import { FacultyRequestsList } from './pages/request/FacultyRequests';
import RequestDetailPage from './pages/request/RequestDetailPage';
import TransportOfficerRequests from './pages/request/TransportOfficerRequests';
import TransportOfficerRequestDetail from './pages/request/TransportOfficerRequestDetail';
import RouteAdd from './pages/to-pages/route-manage/routeAdd';
import RouteList from './pages/to-pages/route-manage/routeList';
import Transition, { DEFAULT_DURATION_MS } from './components/ui/Transition';
import { ProtectedRoute } from './components/ProtectedRoute';
import VehicleList from './pages/to-pages/vehicle-manage/vehicleList';
import VehicleAdd from './pages/to-pages/vehicle-manage/vehicleAdd';
import DriverList from './pages/to-pages/driver-manage/driverList';
import TripTemplateList from './pages/to-pages/trip-templates/tripTemplateList';
import { NavigationControls } from './components/ui/NavigationControls';
import PaymentStartPage from './pages/payment/PaymentStartPage';
import PaymentPage from './pages/payment/PaymentPage';



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
    <>
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
          <Route path="/driver-list" element={<DriverRequestsPage />} />
          <Route path="/driver-dashboard" element={<DriverDashboard />} />
          <Route path="/driver/all-trips" element={<DriverAllTripsPage />} />
          <Route path="/driver/passenger-list" element={<DriverPassengerListPage />} />
        <Route path="/seat-availability" element={<SeatAvailabilityPage />} />
        <Route path="/token-history" element={<TokenHistoryPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<Staff_Profile />} />
        <Route path="/driver-profile" element={<DriverProfile />} />
        <Route path="/buy-token" element={<BuyToken />} />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentStartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:payment_id"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        
        {/* Faculty Transport Routes */}
        <Route path="/dashboard/transport-requests/new" element={<TransportRequestForm />} />
        <Route path="/dashboard/transport-requests/my" element={<FacultyRequestsList />} />
        <Route path="/dashboard/transport-requests/:id" element={<RequestDetailPage />} />
        
        {/* Transport Officer Routes */}
        <Route path="/dashboard/transport-requests/manage" element={<TransportOfficerRequests />} />
        <Route path="/dashboard/transport-requests/:id/manage" element={<TransportOfficerRequestDetail />} />
        <Route path="/dashboard/driver-requests/manage" element={<DriverRequestsPage />} />

        {/* Route Management */}
        <Route 
          path="/to-pages/route-manage/routeAdd" 
          element={
            <ProtectedRoute requiredRoles={[1, 3]}>
              <RouteAdd />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/to-pages/route-manage/routeList" 
          element={
            <ProtectedRoute requiredRoles={[1, 3]}>
              <RouteList />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/to-pages/vehicle-manage/vehicleList"
          element={
            <ProtectedRoute requiredRoles={[1, 3]}>
              <VehicleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/to-pages/vehicle-manage/vehicleAdd"
          element={
            <ProtectedRoute requiredRoles={[1, 3]}>
              <VehicleAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/to-pages/driver-manage/driverList"
          element={
            <ProtectedRoute requiredRoles={[1, 3]}>
              <DriverList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/to-pages/trip-templates/tripTemplateList"
          element={
            <ProtectedRoute requiredRoles={[1, 3]}>
              <TripTemplateList />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Transition>
      <NavigationControls />
    </>
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
