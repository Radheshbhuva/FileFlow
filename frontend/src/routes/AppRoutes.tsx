import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import LandingPage from '../pages/Landing/LandingPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import VerifyEmailPage from '../pages/VerifyEmail/VerifyEmailPage';
import ForgotPasswordPage from '../pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPassword/ResetPasswordPage';
import MyFilesPage from '../pages/MyFiles/MyFilesPage';
import UploadPage from '../pages/Upload/UploadPage';
import SharedFilesPage from '../pages/SharedFiles/SharedFilesPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import UnauthorizedPage from '../pages/Unauthorized/UnauthorizedPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import ShareViewerPage from '../pages/Share/ShareViewerPage';
import SearchCenterPage from '../pages/Search/SearchCenterPage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import ActivityCenterPage from '../pages/Activity/ActivityCenterPage';
import SmartCollectionsPage from '../pages/Collections/SmartCollectionsPage';

interface RouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: RouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: RouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await authService.rememberSession();
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setInitializing(false);
        useAuthStore.getState().setInitialized(true);
      }
    };
    void initAuth();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        <p className="mt-4 text-xs font-semibold text-slate-450">Loading FileFlow...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/my-files" element={<ProtectedRoute><MyFilesPage /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/shared" element={<ProtectedRoute><SharedFilesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchCenterPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><ActivityCenterPage /></ProtectedRoute>} />
      <Route path="/collections" element={<ProtectedRoute><SmartCollectionsPage /></ProtectedRoute>} />

      {/* Public / Auth Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/unauthorized" element={<PublicRoute><UnauthorizedPage /></PublicRoute>} />

      {/* Public Share Links */}
      <Route path="/share/:token" element={<ShareViewerPage />} />
      <Route path="/sh/:token" element={<ShareViewerPage />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;






