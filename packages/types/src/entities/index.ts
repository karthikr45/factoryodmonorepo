/**
 * Domain entities shared across apps.
 * Every entity is multi-tenant: orgId is required (except at auth/OTP layer).
 * Monetary fields are integer paise unless the field name says otherwise.
 */
import type {
  AttendanceStatus,
  GSTReturnStatus,
  GSTReturnType,
  JobCardStatus,
  JournalSourceType,
  LedgerType,
  NotificationChannel,
  NotificationType,
  OrderStatus,
  OrganisationPlan,
  OrganisationType,
  PayrollStatus,
  PurchaseOrderStatus,
  UserRole,
  WorkerDeploymentStatus,
} from '../enums';

export interface Organisation {
  id: string;
  name: string;
  gstin: string | null;
  type: OrganisationType;
  plan: OrganisationPlan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

export interface OTP {
  id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  orgId: string;
  name: string;
  managerId: string | null;
  sequence: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  orgId: string;
  customerId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  deliveryDate: Date;
  status: OrderStatus;
  totalValue: number;   // paise
  advancePaid: number;  // paise
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobCard {
  id: string;
  orderId: string;
  departmentId: string;
  orgId: string;
  assignedTo: string | null;
  status: JobCardStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  estimatedHours: number | null;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string | null;
  gstin: string | null;
  address: string | null;
  creditLimit: number;        // paise
  outstandingAmount: number;  // paise
}

export interface Worker {
  id: string;
  agencyOrgId: string;
  name: string;
  phone: string;
  aadhaarLast4: string;
  skill: string;
  dailyRate: number; // paise
  epfNumber: string | null;
  esicNumber: string | null;
  isActive: boolean;
  joinedAt: Date;
}

export interface WorkerDeployment {
  id: string;
  workerId: string;
  factoryOrgId: string;
  agencyOrgId: string;
  startDate: Date;
  endDate: Date | null;
  status: WorkerDeploymentStatus;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  factoryOrgId: string;
  agencyOrgId: string;
  date: Date;
  status: AttendanceStatus;
  overtime: number; // hours
  markedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  disputeNote: string | null;
  isDisputed: boolean;
}

export interface Payroll {
  id: string;
  workerId: string;
  agencyOrgId: string;
  factoryOrgId: string;
  month: number; // 1–12
  year: number;
  daysPresent: number;
  daysAbsent: number;
  overtimeHours: number;
  basicAmount: number;   // paise
  epfDeduction: number;  // paise
  esicDeduction: number; // paise
  netAmount: number;     // paise
  status: PayrollStatus;
  paidAt: Date | null;
}

export interface PurchaseOrderItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // paise
  gstRate: number;   // percentage e.g. 18
}

export interface PurchaseOrder {
  id: string;
  orgId: string;
  vendorId: string;
  poNumber: string;
  items: PurchaseOrderItem[];
  totalAmount: number; // paise
  gstAmount: number;   // paise
  status: PurchaseOrderStatus;
  expectedDate: Date | null;
  receivedDate: Date | null;
}

export interface Vendor {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  gstin: string | null;
  address: string | null;
  rating: number | null;
  totalOrders: number;
}

export interface JournalEntry {
  id: string;
  orgId: string;
  date: Date;
  description: string;
  debitLedger: string;
  creditLedger: string;
  amount: number; // paise
  currency: string; // default 'INR'
  sourceType: JournalSourceType;
  sourceId: string | null;
  createdAuto: boolean;
  createdBy: string | null;
  financialYear: string; // e.g. "2025-26"
}

export interface Ledger {
  id: string;
  orgId: string;
  name: string;
  type: LedgerType;
  parentId: string | null;
  code: string;
  isSystem: boolean;
}

export interface GSTReturn {
  id: string;
  orgId: string;
  period: string; // e.g. "2025-04" or "2025-26"
  type: GSTReturnType;
  status: GSTReturnStatus;
  filedAt: Date | null;
  filedBy: string | null;
  data: Record<string, unknown>;
}

export interface Notification {
  id: string;
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  channel: NotificationChannel;
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
  createdAt: Date;
}
