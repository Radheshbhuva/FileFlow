import AuthLayout from '../../components/auth/AuthLayout';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { authService } from '../../services/authService';

export default function ForgotPasswordPage() {
  const handleSendResetLink = async (payload: { email: string }) => {
    localStorage.removeItem('fileflow_reset_token');

    // Call real API
    const res = await authService.forgotPassword(payload.email);

    // In development mode, retrieve the token from response to show a manual helper link
    if (res?.resetToken) {
      localStorage.setItem('fileflow_reset_token', res.resetToken);
    }
  };

  return (
    <AuthLayout>
      <ForgotPasswordForm
        onSendResetLink={handleSendResetLink}
      />
    </AuthLayout>
  );
}
