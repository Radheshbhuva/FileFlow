import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import VerifyEmailForm from '../../components/auth/VerifyEmailForm';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <VerifyEmailForm
        onVerify={async () => {
          // TODO: wire to AWS Cognito ConfirmSignUp.
          await sleep(1000);
        }}
        onResend={async () => {
          // TODO: wire to AWS Cognito ResendConfirmationCode.
          await sleep(800);
        }}
        onBackToLogin={() => navigate('/login')}
      />
    </AuthLayout>
  );
}

