import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import VerifyEmailForm from '../../components/auth/VerifyEmailForm';
import { authService } from '../../services/authService';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [initialToken, setInitialToken] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('fileflow_verification_token');
    if (token) {
      setInitialToken(token);
    }
  }, []);

  const handleVerify = async (payload: { code: string }) => {
    await authService.verifyEmail(payload.code);
    localStorage.removeItem('fileflow_pending_email');
    localStorage.removeItem('fileflow_verification_token');
  };

  const handleResend = async () => {
    const pendingEmail = localStorage.getItem('fileflow_pending_email');
    if (!pendingEmail) {
      throw new Error('No pending registration found. Please register first.');
    }
    // Under mock conditions, forgotPassword can be used to generate/regenerate tokens
    await authService.forgotPassword(pendingEmail);
  };

  return (
    <AuthLayout>
      <VerifyEmailForm
        onVerify={handleVerify}
        onResend={handleResend}
        onBackToLogin={() => navigate('/login')}
        initialCode={initialToken}
        key={initialToken}
      />
    </AuthLayout>
  );
}
