import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';
import { authService } from '../../services/authService';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = async (payload: {
    fullName: string;
    email: string;
    password: string;
    planType: 'Free' | 'Professional' | 'Enterprise';
  }) => {
    const backendPlanMap = {
      'Free': 'FREE',
      'Professional': 'PRO',
      'Enterprise': 'ENTERPRISE'
    };

    // Call the backend registration endpoint
    const user = await authService.register({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.password,
      planType: backendPlanMap[payload.planType]
    });

    // Save the pending signup email for verification
    localStorage.setItem('fileflow_pending_email', payload.email);
    
    // In non-production/development mode, save the token locally to prefill verification
    if (user?.verificationToken) {
      localStorage.setItem('fileflow_verification_token', user.verificationToken);
    }

    // Redirect the user to the verification page
    navigate('/verify-email', { replace: true });
  };

  return (
    <AuthLayout>
      <RegisterForm onSubmit={handleRegister} />
    </AuthLayout>
  );
}
