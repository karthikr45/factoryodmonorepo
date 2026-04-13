'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  icon: string | null;
  color: string | null;
}

interface PermissionGroup {
  group: string;
  permissions: Array<{ key: string; label: string }>;
}

const ROLE_ICONS = ['👑', '🏭', '🔍', '💰', '📦', '👷', '👥', '🔧', '⚙️', '🛠️', '📋', '✨'];

export default function RolesPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => apiCall<Role[]>({ url: '/custom-roles' }),
  });

  const { data: groups } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: () => apiCall<PermissionGroup[]>({ url: '/custom-roles/permission-groups' }),
  });

  const seed = (): void => {
    start(async () => {
      const res = await apiCall<{ created: number }>({ url: '/custom-roles/seed-system-roles', method: 'POST' });
      setToast(`Loaded ${res.created} role templates`);
      qc.invalidateQueries({ queryKey: ['roles'] });
    });
  };

  const remove = (id: string): void => {
    if (!confirm('Delete this role?')) return;
    start(async () => {
      try {
        await apiCall({ url: `/custom-roles/${id}`, method: 'DELETE' });
        setToast('Role deleted');
        qc.invalidateQueries({ queryKey: ['roles'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Roles & Permissions</h1>
          <p className="mt-1 text-neutral-600">
            Define who can do what in your factory. Pre-built templates included.
          </p>
        </div>
        <div className="flex gap-2">
          {(!roles || roles.length === 0) && (
            <Button variant="outline" onClick={seed} disabled={pending}>
              Load role templates
            </Button>
          )}
          <Button onClick={() => { setCreating(true); setEditing(null); }}>+ New role</Button>
        </div>
      </div>

      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (roles ?? []).length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-brand-200 bg-white p-12 text-center">
          <div className="text-5xl">👥</div>
          <h2 className="mt-4 text-xl font-semibold text-brand-900">Set up your team roles</h2>
          <p className="mx-auto mt-2 max-w-md text-neutral-600">
            Load 8 pre-built role templates (Owner, Production Manager, QC Head, Store Keeper, etc.)
            and customize from there.
          </p>
          <Button onClick={seed} disabled={pending} className="mt-6">Load role templates</Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(roles ?? []).map((r) => (
            <div key={r.id}
              className="group rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-brand-300">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: (r.color ?? '#562F54') + '20' }}>
                  {r.icon ?? '👤'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-brand-900">{r.name}</h3>
                  {r.description && <p className="mt-0.5 text-sm text-neutral-600 line-clamp-2">{r.description}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                  {r.permissions.length} permissions
                </span>
                {r.isSystem && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">System</span>
                )}
              </div>
              <div className="mt-3 flex justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => { setEditing(r); setCreating(false); }} className="text-sm font-semibold text-brand-700 hover:underline">
                  Edit
                </button>
                {!r.isSystem && (
                  <button onClick={() => remove(r.id)} className="text-sm font-semibold text-danger-600 hover:underline">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && groups && (
        <RoleEditor
          existing={editing}
          permissionGroups={groups}
          icons={ROLE_ICONS}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            setCreating(false); setEditing(null);
            setToast(editing ? 'Role updated' : 'Role created');
            qc.invalidateQueries({ queryKey: ['roles'] });
          }}
        />
      )}
    </div>
  );
}

function RoleEditor({
  existing, permissionGroups, icons, onClose, onSaved,
}: {
  existing: Role | null;
  permissionGroups: PermissionGroup[];
  icons: string[];
  onClose: () => void;
  onSaved: () => void;
}): JSX.Element {
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? '👤');
  const [color, setColor] = useState(existing?.color ?? '#562F54');
  const [permissions, setPermissions] = useState<Set<string>>(new Set(existing?.permissions ?? []));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string): void => {
    const copy = new Set(permissions);
    if (copy.has(key)) copy.delete(key); else copy.add(key);
    setPermissions(copy);
  };

  const toggleGroup = (groupKeys: string[]): void => {
    const copy = new Set(permissions);
    const allSelected = groupKeys.every((k) => copy.has(k));
    if (allSelected) groupKeys.forEach((k) => copy.delete(k));
    else groupKeys.forEach((k) => copy.add(k));
    setPermissions(copy);
  };

  const save = (): void => {
    setError(null);
    if (!name) { setError('Give the role a name'); return; }
    start(async () => {
      try {
        const body = { name, description, icon, color, permissions: [...permissions] };
        if (existing) {
          await apiCall({ url: `/custom-roles/${existing.id}`, method: 'PUT', data: body });
        } else {
          await apiCall({ url: '/custom-roles', method: 'POST', data: body });
        }
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-brand-900">{existing ? 'Edit role' : 'Create role'}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Role name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Batch Release Officer"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-neutral-300" />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-neutral-700">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this role do?"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-neutral-700">Icon</label>
          <div className="mt-1 grid grid-cols-12 gap-1">
            {icons.map((i) => (
              <button key={i} type="button" onClick={() => setIcon(i)}
                className={`flex h-8 items-center justify-center rounded text-base transition ${
                  icon === i ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-neutral-50 hover:bg-neutral-100'
                }`}>{i}</button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Permissions ({permissions.size})
          </h3>
          <div className="mt-3 space-y-3">
            {permissionGroups.map((g) => {
              const groupKeys = g.permissions.map((p) => p.key);
              const allSelected = groupKeys.every((k) => permissions.has(k));
              const someSelected = groupKeys.some((k) => permissions.has(k));
              return (
                <div key={g.group} className="rounded-lg border border-neutral-200 p-3">
                  <button onClick={() => toggleGroup(groupKeys)}
                    className="flex w-full items-center justify-between text-left">
                    <span className="font-semibold text-brand-900">{g.group}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      allSelected ? 'bg-success-100 text-success-700'
                        : someSelected ? 'bg-warning-100 text-warning-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {allSelected ? 'All' : someSelected ? 'Some' : 'None'}
                    </span>
                  </button>
                  <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {g.permissions.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
                        <input type="checkbox" checked={permissions.has(p.key)} onChange={() => toggle(p.key)} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && <div className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? 'Saving...' : 'Save role'}</Button>
        </div>
      </div>
    </div>
  );
}
