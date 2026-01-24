import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SubscriberDashboardPage from './pages/dashboard/SubscriberDashboardPage';

function PageTransition({ children }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={[
        'transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            element={
              <PageTransition>
                <AuthLayout />
              </PageTransition>
            }
          >
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route
            path="/dashboard"
            element={
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            }
          />
          <Route
            path="/subscriber"
            element={
              <PageTransition>
                <SubscriberDashboardPage />
              </PageTransition>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
