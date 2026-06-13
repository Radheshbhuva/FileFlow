import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <RegisterForm
        onSubmit={async () => {
          // TODO: wire to AWS Cognito SignUp.
          await sleep(950);
          // After successful signup, go to verification.
          navigate('/verify-email');
        }}
      />
    </AuthLayout>
  );
}

