import { SignupForm } from './signup-form';

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; token?: string }>;
}): JSX.Element {
  return <SignupForm searchParamsPromise={searchParams} />;
}
