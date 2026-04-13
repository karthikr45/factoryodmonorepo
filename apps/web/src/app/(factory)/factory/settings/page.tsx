'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

interface Member {
  id: string; name: string; phone: string; email: string | null;
  role: string; isActive: boolean; lastLogin: string | null;
}

interface Invitation {
  id: string; type: string; status: string;
  inviteeName: string | null; inviteePhone: string | null;
  targetOrgName: string | null; createdAt: string; expiresAt: string;
}

interface Partner {
  id: string; orgName: string; orgType: string;
  relationshipType: string; status: string; since: string | null;
}

export default function SettingsPage(): JSX.Element {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'team' | 'partners' | 'invitations'>('team');
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Forms
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [tmName, setTmName] = useState('');
  const [tmPhone, setTmPhone] = useState('+91');
  const [tmRole, setTmRole] = useState('MANAGER');

  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('+91');
  const [pGstin, setPGstin] = useState('');
  const [pType, setPType] = useState<'CA_FIRM' | 'AGENCY'>('CA_FIRM');

  const { data: members } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: () => apiCall<Member[]>({ url: '/organisations/members' }),
  });

  const { data: partners } = useQuery<{ incoming: Partner[]; outgoing: Partner[] }>({
    queryKey: ['partners'],
    queryFn: () => apiCall({ url: '/relationships' }),
  });

  const { data: invitations } = useQuery<Invitation[]>({
    queryKey: ['invitations'],
    queryFn: () => apiCall<Invitation[]>({ url: '/invitations' }),
  });

  const inviteTeam = (): void => {
    start(async () => {
      try {
        await apiCall({
          url: '/invitations/team', method: 'POST',
          data: { name: tmName, phone: tmPhone, role: tmRole },
        });
        setToast(`Invitation sent to ${tmName}`);
        setShowTeamForm(false);
        setTmName(''); setTmPhone('+91');
        qc.invalidateQueries({ queryKey: ['invitations'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const invitePartner = (): void => {
    start(async () => {
      try {
        await apiCall({
          url: '/invitations/organisation', method: 'POST',
          data: {
            targetOrgName: pName, targetPhone: pPhone,
            targetGstin: pGstin || undefined,
            targetOrgType: pType,
            relationshipType: pType === 'CA_FIRM' ? 'FACTORY_CA' : 'FACTORY_AGENCY',
          },
        });
        setToast(`Invitation sent to ${pName}`);
        setShowPartnerForm(false);
        setPName(''); setPPhone('+91'); setPGstin('');
        qc.invalidateQueries({ queryKey: ['partners', 'invitations'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const respondPartner = (id: string, action: 'accept' | 'reject'): void => {
    start(async () => {
      try {
        await apiCall({ url: `/relationships/${id}/${action}`, method: 'POST' });
        setToast(`Request ${action === 'accept' ? 'accepted' : 'rejected'}`);
        qc.invalidateQueries({ queryKey: ['partners'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Settings</h1>
      <p className="mt-1 text-neutral-600">Manage your team, partners, and connections</p>

      <div className="mt-4 flex gap-2">
        {([
          { key: 'team', label: 'My Team' },
          { key: 'partners', label: 'Partners (CA & Agencies)' },
          { key: 'invitations', label: 'Pending Invitations' },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              tab === t.key ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      {/* Team members */}
      {tab === 'team' && (
        <div className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowTeamForm(!showTeamForm)}>+ Invite team member</Button>
          </div>

          {showTeamForm && (
            <div className="mb-4 max-w-lg rounded-lg border border-neutral-200 bg-white p-4">
              <div className="space-y-3">
                <input placeholder="Name (e.g. Venkat Rao)" value={tmName} onChange={(e) => setTmName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2" />
                <input placeholder="+919876543210" value={tmPhone} onChange={(e) => setTmPhone(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2" />
                <select value={tmRole} onChange={(e) => setTmRole(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2">
                  <option value="MANAGER">Manager (sees production, orders)</option>
                  <option value="ACCOUNTANT">Accountant (sees finance, invoices)</option>
                  <option value="WORKER">Worker (mobile only — sees own tasks)</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={inviteTeam} disabled={pending || !tmName || tmPhone.length < 13}>
                    {pending ? 'Sending...' : 'Send invitation'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowTeamForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(members ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">No team members yet</td></tr>
                ) : (members ?? []).map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{m.phone}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{m.role}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {m.lastLogin ? formatIST(m.lastLogin) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partners */}
      {tab === 'partners' && (
        <div className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowPartnerForm(!showPartnerForm)}>+ Add partner</Button>
          </div>

          {showPartnerForm && (
            <div className="mb-4 max-w-lg rounded-lg border border-neutral-200 bg-white p-4">
              <div className="space-y-3">
                <select value={pType} onChange={(e) => setPType(e.target.value as 'CA_FIRM' | 'AGENCY')}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2">
                  <option value="CA_FIRM">My Chartered Accountant</option>
                  <option value="AGENCY">Staffing Agency</option>
                </select>
                <input placeholder="Business name" value={pName} onChange={(e) => setPName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2" />
                <input placeholder="+919876543210" value={pPhone} onChange={(e) => setPPhone(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2" />
                <input placeholder="GSTIN (optional — helps find existing businesses)" value={pGstin}
                  onChange={(e) => setPGstin(e.target.value.toUpperCase())}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 uppercase" />
                <div className="flex gap-2">
                  <Button onClick={invitePartner} disabled={pending || !pName || pPhone.length < 13}>
                    {pending ? 'Sending...' : 'Send invitation'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowPartnerForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* Incoming requests */}
          {(partners?.incoming ?? []).filter((p) => p.status === 'PENDING').length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-warning-700">Pending requests</h2>
              <div className="mt-2 space-y-2">
                {(partners?.incoming ?? []).filter((p) => p.status === 'PENDING').map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 p-4">
                    <div>
                      <div className="font-semibold">{p.orgName}</div>
                      <div className="text-sm text-neutral-600">{p.orgType} wants to connect as {p.relationshipType.replace('_', ' ').toLowerCase()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respondPartner(p.id, 'accept')}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => respondPartner(p.id, 'reject')}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active partners */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Active partners</h2>
            <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Business</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Relationship</th>
                    <th className="px-4 py-3 font-medium">Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[...(partners?.outgoing ?? []), ...(partners?.incoming ?? [])]
                    .filter((p) => p.status === 'ACTIVE').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                        No partners yet. Invite your CA or a staffing agency above.
                      </td>
                    </tr>
                  ) : [...(partners?.outgoing ?? []), ...(partners?.incoming ?? [])]
                    .filter((p) => p.status === 'ACTIVE').map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium">{p.orgName}</td>
                      <td className="px-4 py-3">{p.orgType}</td>
                      <td className="px-4 py-3 text-neutral-600">{p.relationshipType.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-neutral-600">{p.since ? formatIST(p.since).split(',')[0] : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invitations sent */}
      {tab === 'invitations' && (
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Sent to</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(invitations ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">No invitations sent yet</td></tr>
              ) : (invitations ?? []).map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-medium">
                    {i.inviteeName ?? i.targetOrgName} <span className="text-neutral-500">({i.inviteePhone ?? '—'})</span>
                  </td>
                  <td className="px-4 py-3">{i.type === 'TEAM_MEMBER' ? 'Team member' : 'Organisation'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      i.status === 'ACCEPTED' ? 'bg-success-50 text-success-700'
                        : i.status === 'PENDING' ? 'bg-warning-50 text-warning-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatIST(i.expiresAt).split(',')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
