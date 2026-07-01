import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import { authService } from '../../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (payload: { email: string; password: string }) => {
    await authService.login(payload.email, payload.password);
  };

  const handleSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout>
      <LoginForm
        onSubmit={handleLogin}
        onSuccess={handleSuccess}
      />
    </AuthLayout>
  );
}


