import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.organisation.isActive) {
    redirect('/factory');
  }
  return (
    <main className="min-h-screen bg-brand-50 px-6 py-12">
      <div className="mx-auto max-w-xl rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-900">Tell us about your business</h1>
        <p className="mt-2 text-neutral-600">
          We will set up your dashboard with the right portal, chart of accounts,
          and default production stages.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
