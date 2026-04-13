/**
 * Permission keys that can be granted to a custom role.
 * Each key is a dotted action, like "orders.create" or "finance.view".
 */

export const PERMISSION_GROUPS: Array<{
  group: string;
  permissions: Array<{ key: string; label: string }>;
}> = [
  {
    group: 'Orders',
    permissions: [
      { key: 'orders.view', label: 'View orders' },
      { key: 'orders.create', label: 'Create orders' },
      { key: 'orders.edit', label: 'Edit orders' },
      { key: 'orders.dispatch', label: 'Dispatch orders' },
      { key: 'orders.delete', label: 'Cancel orders' },
    ],
  },
  {
    group: 'Production',
    permissions: [
      { key: 'production.view', label: 'View job cards' },
      { key: 'production.update', label: 'Update job card status' },
      { key: 'production.assign', label: 'Assign job cards' },
    ],
  },
  {
    group: 'Quality',
    permissions: [
      { key: 'qc.view', label: 'View QC records' },
      { key: 'qc.perform', label: 'Perform QC' },
      { key: 'qc.approve', label: 'Approve/reject QC' },
    ],
  },
  {
    group: 'Inventory & Procurement',
    permissions: [
      { key: 'inventory.view', label: 'View inventory' },
      { key: 'inventory.update', label: 'Adjust stock' },
      { key: 'procurement.view', label: 'View POs' },
      { key: 'procurement.create', label: 'Create POs' },
      { key: 'procurement.receive', label: 'Mark PO received' },
    ],
  },
  {
    group: 'People',
    permissions: [
      { key: 'employees.view', label: 'View employees' },
      { key: 'employees.manage', label: 'Add/edit employees' },
      { key: 'attendance.view', label: 'View attendance' },
      { key: 'attendance.approve', label: 'Approve attendance' },
      { key: 'attendance.dispute', label: 'Raise disputes' },
    ],
  },
  {
    group: 'Finance',
    permissions: [
      { key: 'finance.view', label: 'View books' },
      { key: 'finance.create', label: 'Create manual entries' },
      { key: 'invoices.view', label: 'View invoices' },
      { key: 'invoices.create', label: 'Create invoices' },
      { key: 'payments.record', label: 'Record payments' },
      { key: 'reports.view', label: 'View financial reports' },
    ],
  },
  {
    group: 'Admin',
    permissions: [
      { key: 'workflows.manage', label: 'Edit workflows' },
      { key: 'roles.manage', label: 'Edit roles & permissions' },
      { key: 'approvals.manage', label: 'Edit approval rules' },
      { key: 'team.manage', label: 'Invite / remove team members' },
      { key: 'partners.manage', label: 'Connect CAs / agencies' },
      { key: 'settings.manage', label: 'Edit organisation settings' },
    ],
  },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

/**
 * Pre-made role templates so admins don't start from scratch.
 */
export const ROLE_TEMPLATES: Array<{
  name: string;
  description: string;
  icon: string;
  color: string;
  permissions: string[];
}> = [
  {
    name: 'Factory Owner',
    description: 'Full access to everything',
    icon: '👑',
    color: '#562F54',
    permissions: ALL_PERMISSIONS,
  },
  {
    name: 'Production Manager',
    description: 'Manages orders, production, and QC',
    icon: '🏭',
    color: '#525AFF',
    permissions: [
      'orders.view', 'orders.create', 'orders.edit', 'orders.dispatch',
      'production.view', 'production.update', 'production.assign',
      'qc.view', 'qc.perform', 'qc.approve',
      'attendance.view', 'attendance.approve',
      'employees.view',
    ],
  },
  {
    name: 'QC Head',
    description: 'Quality control authority',
    icon: '🔍',
    color: '#F59E0B',
    permissions: [
      'orders.view', 'production.view',
      'qc.view', 'qc.perform', 'qc.approve',
    ],
  },
  {
    name: 'Accountant',
    description: 'Manages books, invoices, and payments',
    icon: '💰',
    color: '#10B981',
    permissions: [
      'orders.view', 'invoices.view', 'invoices.create',
      'payments.record', 'finance.view', 'finance.create', 'reports.view',
      'procurement.view',
    ],
  },
  {
    name: 'Store Keeper',
    description: 'Manages inventory and material issue',
    icon: '📦',
    color: '#6366F1',
    permissions: [
      'inventory.view', 'inventory.update',
      'procurement.view', 'procurement.receive',
      'production.view',
    ],
  },
  {
    name: 'Floor Supervisor',
    description: 'Supervises workers on the shop floor',
    icon: '👷',
    color: '#EC4899',
    permissions: [
      'production.view', 'production.update', 'production.assign',
      'attendance.view', 'attendance.approve',
      'qc.view',
    ],
  },
  {
    name: 'HR Manager',
    description: 'Manages employees and attendance',
    icon: '👥',
    color: '#8B5CF6',
    permissions: [
      'employees.view', 'employees.manage',
      'attendance.view', 'attendance.approve', 'attendance.dispute',
      'team.manage',
    ],
  },
  {
    name: 'Worker / Operator',
    description: 'Floor worker — sees own tasks',
    icon: '🔧',
    color: '#64748B',
    permissions: [
      'production.view', 'production.update',
      'attendance.view',
    ],
  },
];
