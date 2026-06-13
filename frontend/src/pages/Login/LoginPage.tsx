import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <LoginForm
        onSubmit={async () => {
          // TODO: wire to AWS Cognito SignIn.
          await sleep(900);
        }}
      />

      {/* Navigation handled inside the form links. */}
    </AuthLayout>
  );
}

