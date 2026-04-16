'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface Employee {
  id: string;
  type: 'direct' | 'contract';
  name: string;
  phone: string;
  role: string;
  customRoleId: string | null;
  department: string | null;
  designation: string | null;
  dailyRateOrSalary: number;
  salaryType: 'monthly' | 'daily';
  isActive: boolean;
  joiningDate: string;
}

interface Department {
  id: string;
  name: string;
  sequence: number;
}

interface CustomRole {
  id: string;
  name: string;
  icon: string | null;
}

export default function EmployeesPage(): JSX.Element {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'direct' | 'contract'>('all');
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [role, setRole] = useState<'MANAGER' | 'WORKER'>('WORKER');
  const [deptId, setDeptId] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => apiCall<Employee[]>({ url: '/organisations/employees' }),
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => apiCall<Department[]>({ url: '/production/departments' }),
  });

  const { data: customRoles } = useQuery<CustomRole[]>({
    queryKey: ['custom-roles'],
    queryFn: () => apiCall<CustomRole[]>({ url: '/custom-roles' }),
  });

  const assignRole = (userId: string, customRoleId: string | null): void => {
    start(async () => {
      try {
        await apiCall({
          url: `/custom-roles/assign/${userId}`,
          method: 'PUT',
          data: { customRoleId },
        });
        setToast(customRoleId ? 'Role updated' : 'Role removed');
        qc.invalidateQueries({ queryKey: ['employees'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const filtered = employees?.filter((e) =>
    filter === 'all' ? true : e.type === filter,
  );

  const directCount = employees?.filter((e) => e.type === 'direct').length ?? 0;
  const contractCount = employees?.filter((e) => e.type === 'contract').length ?? 0;

  const addEmployee = (): void => {
    start(async () => {
      try {
        await apiCall({
          url: '/organisations/employees', method: 'POST',
          data: {
            name, phone, role, designation,
            departmentId: deptId || undefined,
            monthlySalary: Math.round(Number(salary) * 100),
          },
        });
        setToast(`${name} added as ${designation}`);
        setShowForm(false);
        setName(''); setPhone('+91'); setDesignation(''); setSalary('');
        qc.invalidateQueries({ queryKey: ['employees'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Employees</h1>
          <p className="mt-1 text-neutral-600">
            {directCount} direct staff + {contractCount} contract workers = {(directCount + contractCount)} total
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add direct employee</Button>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>
      )}

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2">
        {([
          { key: 'all', label: `All (${employees?.length ?? 0})` },
          { key: 'direct', label: `Direct (${directCount})` },
          { key: 'contract', label: `Contract (${contractCount})` },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              filter === t.key ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Add employee form */}
      {showForm && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">Add direct employee</h2>
          <div className="mt-4 space-y-4">
            <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="grid grid-cols-2 gap-3">
              <select value={role} onChange={(e) => setRole(e.target.value as 'MANAGER' | 'WORKER')}
                className="rounded-md border border-neutral-300 px-3 py-2">
                <option value="WORKER">Worker</option>
                <option value="MANAGER">Manager</option>
              </select>
              <select value={deptId} onChange={(e) => setDeptId(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2">
                <option value="">No department</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <input placeholder="Designation (e.g. CNC Operator)" value={designation} onChange={(e) => setDesignation(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="Monthly salary (Rs)" type="number" value={salary} onChange={(e) => setSalary(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="flex gap-2">
              <Button onClick={addEmployee} disabled={pending || !name || !phone || !designation || !salary}>
                {pending ? 'Adding...' : 'Add employee'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Employee table */}
      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Designation / Skill</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Permission role</th>
                <th className="px-4 py-3 font-medium text-right">Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(filtered ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    {filter === 'contract'
                      ? 'No contract workers deployed. Ask your staffing agency to deploy workers.'
                      : 'No employees yet. Add your first direct employee above.'}
                  </td>
                </tr>
              ) : (filtered ?? []).map((e) => (
                <tr key={e.id + e.type}>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      e.type === 'direct'
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-accent-50 text-accent-700'
                    }`}>
                      {e.type === 'direct' ? 'Direct' : 'Contract'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{e.designation ?? e.role}</td>
                  <td className="px-4 py-3 text-neutral-600">{e.department ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{e.phone}</td>
                  <td className="px-4 py-3">
                    {e.type === 'direct' ? (
                      <select
                        value={e.customRoleId ?? ''}
                        onChange={(ev) => assignRole(e.id, ev.target.value || null)}
                        disabled={pending}
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                      >
                        <option value="">Default ({e.role})</option>
                        {(customRoles ?? []).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.icon ? `${r.icon} ` : ''}{r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-neutral-400">n/a</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatINR(e.dailyRateOrSalary)}
                    <span className="text-xs text-neutral-500">/{e.salaryType === 'monthly' ? 'mo' : 'day'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
