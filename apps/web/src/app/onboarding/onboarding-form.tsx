'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { OrganisationType } from '@repo/types';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

type Step = 'business' | 'team' | 'connect' | 'done';

export function OnboardingForm(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<Step>('business');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business info
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [type, setType] = useState<OrganisationType>(OrganisationType.FACTORY);
  const [ownerName, setOwnerName] = useState('');

  // Step 2: Invite team members
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; phone: string; role: string }>>([]);
  const [tmName, setTmName] = useState('');
  const [tmPhone, setTmPhone] = useState('+91');
  const [tmRole, setTmRole] = useState('MANAGER');

  // Step 3: Connect partners
  const [partners, setPartners] = useState<Array<{
    targetOrgName: string; targetPhone: string; targetOrgType: string; relationshipType: string;
  }>>([]);
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('+91');
  const [pType, setPType] = useState<'CA_FIRM' | 'AGENCY'>('CA_FIRM');

  const saveBusinessInfo = (): void => {
    if (!name || !ownerName) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    start(async () => {
      try {
        await apiCall({
          url: '/organisations/onboard', method: 'POST',
          data: { name, gstin: gstin || undefined, type, ownerName },
        });
        // For factories, also seed workflow templates and role templates so
        // they have a working setup immediately
        if (type === OrganisationType.FACTORY) {
          await Promise.all([
            apiCall({ url: '/workflows/seed-system-templates', method: 'POST' }).catch(() => undefined),
            apiCall({ url: '/custom-roles/seed-system-roles', method: 'POST' }).catch(() => undefined),
          ]);
          setStep('team');
        } else {
          setStep('done');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const addTeamMember = (): void => {
    if (!tmName || tmPhone.length < 13) return;
    setTeamMembers([...teamMembers, { name: tmName, phone: tmPhone, role: tmRole }]);
    setTmName(''); setTmPhone('+91'); setTmRole('MANAGER');
  };

  const sendTeamInvites = (): void => {
    setError(null);
    start(async () => {
      try {
        for (const m of teamMembers) {
          await apiCall({ url: '/invitations/team', method: 'POST', data: m });
        }
        setStep('connect');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send invites');
      }
    });
  };

  const addPartner = (): void => {
    if (!pName || pPhone.length < 13) return;
    setPartners([...partners, {
      targetOrgName: pName, targetPhone: pPhone,
      targetOrgType: pType,
      relationshipType: pType === 'CA_FIRM' ? 'FACTORY_CA' : 'FACTORY_AGENCY',
    }]);
    setPName(''); setPPhone('+91');
  };

  const sendPartnerInvites = (): void => {
    setError(null);
    start(async () => {
      try {
        for (const p of partners) {
          await apiCall({ url: '/invitations/organisation', method: 'POST', data: p });
        }
        setStep('done');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const finish = (): void => {
    if (type === OrganisationType.AGENCY) router.push('/agency');
    else if (type === OrganisationType.CA_FIRM) router.push('/ca');
    else router.push('/factory');
  };

  const steps = type === OrganisationType.FACTORY
    ? ['business', 'team', 'connect', 'done']
    : ['business', 'done'];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="mt-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              i <= currentIdx ? 'bg-brand-700 text-white' : 'bg-neutral-200 text-neutral-500'
            }`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-1 flex-1 ${i < currentIdx ? 'bg-brand-700' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-xs text-neutral-500">
        <div className="flex-1">Business</div>
        {type === OrganisationType.FACTORY && <><div className="flex-1 text-center">Team</div><div className="flex-1 text-center">Partners</div></>}
        <div className="flex-1 text-right">Done</div>
      </div>

      {/* Step 1: Business info */}
      {step === 'business' && (
        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Your name *</span>
            <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Ravi Kumar"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Business name *</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Hyderabad Precision Components"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Business type *</span>
            <select value={type} onChange={(e) => setType(e.target.value as OrganisationType)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200">
              <option value={OrganisationType.FACTORY}>Factory / Manufacturer</option>
              <option value={OrganisationType.AGENCY}>Staffing Agency</option>
              <option value={OrganisationType.CA_FIRM}>Chartered Accountant</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">GSTIN <span className="text-neutral-400">(optional)</span></span>
            <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="36ABCDE1234F1Z5"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 uppercase focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
          </label>
          <Button onClick={saveBusinessInfo} disabled={pending} className="w-full">
            {pending ? 'Setting up...' : 'Continue'}
          </Button>
        </div>
      )}

      {/* Step 2: Invite team */}
      {step === 'team' && (
        <div className="mt-8">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Invite your team</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Add your production manager, QC head, accountant, and floor staff. Each gets their own
              login with the right permissions.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {teamMembers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-2 text-neutral-500">{m.phone}</span>
                </div>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{m.role}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input placeholder="Name" value={tmName} onChange={(e) => setTmName(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <input placeholder="+919876543210" value={tmPhone} onChange={(e) => setTmPhone(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <select value={tmRole} onChange={(e) => setTmRole(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
                <option value="MANAGER">Manager</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="WORKER">Worker / Operator</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={addTeamMember} className="mt-3">+ Add to list</Button>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={sendTeamInvites} disabled={pending}>
              {teamMembers.length > 0 ? `Send ${teamMembers.length} invite${teamMembers.length > 1 ? 's' : ''} & continue` : 'Skip for now'}
            </Button>
            <Button variant="outline" onClick={() => setStep('connect')}>Skip</Button>
          </div>
        </div>
      )}

      {/* Step 3: Connect partners */}
      {step === 'connect' && (
        <div className="mt-8">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Connect your partners</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Add your CA and staffing agencies. They&apos;ll get an invite to sign up (or connect if
              they&apos;re already on FactoryOS). Your CA will see your books live. Your agency can
              deploy workers here.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {partners.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{p.targetOrgName}</span>
                  <span className="ml-2 text-neutral-500">{p.targetPhone}</span>
                </div>
                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-700">
                  {p.targetOrgType === 'CA_FIRM' ? 'CA' : 'Staffing Agency'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input placeholder="Business name" value={pName} onChange={(e) => setPName(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <input placeholder="+919876543210" value={pPhone} onChange={(e) => setPPhone(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <select value={pType} onChange={(e) => setPType(e.target.value as 'CA_FIRM' | 'AGENCY')}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
                <option value="CA_FIRM">My CA</option>
                <option value="AGENCY">Staffing Agency</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={addPartner} className="mt-3">+ Add to list</Button>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={sendPartnerInvites} disabled={pending}>
              {partners.length > 0 ? `Send ${partners.length} invite${partners.length > 1 ? 's' : ''} & finish` : 'Skip for now'}
            </Button>
            <Button variant="outline" onClick={() => setStep('done')}>Skip</Button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="mt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-3xl">✓</div>
          <h2 className="mt-4 text-2xl font-bold text-brand-900">You&apos;re all set!</h2>
          <p className="mt-2 text-neutral-600">
            Your workspace is ready. {teamMembers.length > 0 && `${teamMembers.length} team member${teamMembers.length > 1 ? 's' : ''} invited. `}
            {partners.length > 0 && `${partners.length} partner${partners.length > 1 ? 's' : ''} notified. `}
            Let&apos;s get to work.
          </p>
          <Button onClick={finish} className="mt-6">Go to dashboard</Button>
        </div>
      )}

      {error ? (
        <div className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
      ) : null}
    </div>
  );
}
