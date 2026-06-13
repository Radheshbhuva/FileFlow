import { Route, Routes } from 'react-router-dom';
import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import VerifyEmailPage from '../pages/VerifyEmail/VerifyEmailPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Landing as the default route */}
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  );
}

export default AppRoutes;

