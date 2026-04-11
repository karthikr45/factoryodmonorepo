/**
 * Indian compliance validators.
 * These are shared by every form and every API endpoint.
 * If a value is stored in the database, it has to pass through here first.
 */
import { z } from 'zod';

/**
 * Indian mobile number stored with +91 country code.
 * Matches: +91 followed by 10 digits starting with 6, 7, 8, or 9.
 */
export const indianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Must be a valid Indian mobile number with +91 prefix');

/**
 * GSTIN — 15-character alphanumeric ID.
 * Format: 2 state code digits, 10-char PAN, 1 entity digit, "Z", 1 checksum char.
 * Example: 29ABCDE1234F1Z5
 */
export const gstinSchema = z
  .string()
  .length(15, 'GSTIN must be exactly 15 characters')
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GSTIN format',
  )
  .transform((v) => v.toUpperCase());

/**
 * PAN — 10-character Permanent Account Number.
 * Example: ABCDE1234F
 */
export const panSchema = z
  .string()
  .length(10, 'PAN must be exactly 10 characters')
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
  .transform((v) => v.toUpperCase());

/**
 * We only store the last 4 digits of Aadhaar — never the full number.
 */
export const aadhaarLast4Schema = z
  .string()
  .length(4, 'Must be last 4 digits of Aadhaar')
  .regex(/^\d{4}$/, 'Must be 4 digits');

/**
 * IFSC — 11-character bank branch code.
 * Format: 4 alpha (bank) + "0" + 6 alphanumeric (branch).
 */
export const ifscSchema = z
  .string()
  .length(11, 'IFSC must be exactly 11 characters')
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format')
  .transform((v) => v.toUpperCase());

/**
 * Indian bank account number — 9 to 18 digits.
 */
export const bankAccountSchema = z
  .string()
  .regex(/^\d{9,18}$/, 'Bank account must be 9 to 18 digits');

/**
 * 6-digit OTP code.
 */
export const otpCodeSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must be 6 digits');

/**
 * Indian financial year like "2025-26".
 */
export const financialYearSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Financial year must be in YYYY-YY format');

/**
 * Monetary amount: must be an integer (paise). No floats.
 */
export const paiseSchema = z
  .number()
  .int('Monetary values must be stored as integer paise')
  .nonnegative('Amount cannot be negative');
