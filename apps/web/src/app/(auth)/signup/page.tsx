import { SignupForm } from './signup-form';

export default function SignupPage({
  searchParams,
}: {
  searchParams: { role?: string; token?: string };
}): JSX.Element {
  return <SignupForm role={searchParams.role ?? null} inviteToken={searchParams.token ?? null} />;
}
