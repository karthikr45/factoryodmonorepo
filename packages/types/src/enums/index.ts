/**
 * Enums shared across web, mobile, and API.
 * Keep string values stable — they are persisted to the database.
 */

export enum OrganisationType {
  FACTORY = 'FACTORY',
  AGENCY = 'AGENCY',
  CA_FIRM = 'CA_FIRM',
}

export enum OrganisationPlan {
  FREE = 'FREE',
  PRO = 'PRO',
}

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CA = 'CA',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  WORKER = 'WORKER',
}

export enum OrderStatus {
  ENQUIRY = 'ENQUIRY',
  CONFIRMED = 'CONFIRMED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  QUALITY_CHECK = 'QUALITY_CHECK',
  READY = 'READY',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum JobCardStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  HOLIDAY = 'HOLIDAY',
}

export enum WorkerDeploymentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
}

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum JournalSourceType {
  ORDER = 'ORDER',
  ATTENDANCE = 'ATTENDANCE',
  PURCHASE = 'PURCHASE',
  MANUAL = 'MANUAL',
}

export enum LedgerType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  EQUITY = 'EQUITY',
}

export enum GSTReturnType {
  GSTR1 = 'GSTR1',
  GSTR3B = 'GSTR3B',
  GSTR9 = 'GSTR9',
}

export enum GSTReturnStatus {
  DRAFT = 'DRAFT',
  FILED = 'FILED',
  PENDING = 'PENDING',
}

export enum NotificationChannel {
  INAPP = 'INAPP',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum NotificationType {
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  JOBCARD_ASSIGNED = 'JOBCARD_ASSIGNED',
  JOBCARD_COMPLETED = 'JOBCARD_COMPLETED',
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  ATTENDANCE_APPROVED = 'ATTENDANCE_APPROVED',
  ATTENDANCE_DISPUTED = 'ATTENDANCE_DISPUTED',
  PAYROLL_READY = 'PAYROLL_READY',
  CA_QUERY_RAISED = 'CA_QUERY_RAISED',
  GST_RETURN_DUE = 'GST_RETURN_DUE',
  GENERIC = 'GENERIC',
}
