import { Route, Routes } from 'react-router-dom';
import LandingPage from '../pages/Landing/LandingPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import VerifyEmailPage from '../pages/VerifyEmail/VerifyEmailPage';
import ForgotPasswordPage from '../pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPassword/ResetPasswordPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Landing as the default route */}
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  );
}

export default AppRoutes;


