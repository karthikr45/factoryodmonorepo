'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { OrganisationType } from '@repo/types';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

export function OnboardingForm(): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [type, setType] = useState<OrganisationType>(OrganisationType.FACTORY);
  const [ownerName, setOwnerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await apiCall<{ id: string; name: string; type: string }>({
          url: '/organisations/onboard',
          method: 'POST',
          data: {
            name,
            gstin: gstin || undefined,
            type,
            ownerName,
          },
        });
        if (type === OrganisationType.AGENCY) router.push('/agency');
        else if (type === OrganisationType.CA_FIRM) router.push('/ca');
        else router.push('/factory');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Onboarding failed');
      }
    });
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Business name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Your name</span>
        <input
          required
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Business type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as OrganisationType)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value={OrganisationType.FACTORY}>Factory / Manufacturer</option>
          <option value={OrganisationType.AGENCY}>Staffing Agency</option>
          <option value={OrganisationType.CA_FIRM}>Chartered Accountant</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">
          GSTIN <span className="text-neutral-400">(optional)</span>
        </span>
        <input
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="36ABCDE1234F1Z5"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 uppercase focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Setting up...' : 'Complete setup'}
      </Button>

      {error ? (
        <div className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </div>
      ) : null}
    </form>
  );
}
