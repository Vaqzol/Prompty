import { generateSecret, generateSync, verifySync, generateURI } from 'otplib/functional';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ────────────────────────────────────────────
// Encryption helpers (AES-256-GCM)
// ────────────────────────────────────────────
const ENCRYPTION_KEY = process.env.AUTH_SECRET || 'fallback-secret-key-32-chars-long!';

function getKeyBuffer(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

export function encryptSecret(secret: string): string {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), encrypted.toString('hex'), tag.toString('hex')].join(':');
}

export function decryptSecret(encrypted: string): string {
  const [ivHex, encHex, tagHex] = encrypted.split(':');
  const key = getKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const encBuf = Buffer.from(encHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encBuf).toString('utf8') + decipher.final('utf8');
}

// ────────────────────────────────────────────
// TOTP helpers (using otplib/functional sync API)
// ────────────────────────────────────────────

/** สร้าง TOTP secret ใหม่และ QR Code สำหรับ Setup */
export async function generateMfaSetupData(
  userEmail: string
): Promise<{ secret: string; qrCodeUrl: string; otpAuthUri: string }> {
  const secret = generateSecret();
  const otpAuthUri = generateURI({
    label: userEmail,
    issuer: 'Prompty',
    secret,
  });
  const qrCodeUrl = await QRCode.toDataURL(otpAuthUri);
  return { secret, qrCodeUrl, otpAuthUri };
}

/** ตรวจสอบ TOTP token กับ secret (plain text) */
export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    const result = verifySync({ token: token.replace(/\s/g, ''), secret });
    return typeof result === 'object' ? result.valid : !!result;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────
// Backup codes
// ────────────────────────────────────────────

/** สร้าง backup codes 8 ชุด (plain text สำหรับแสดงผู้ใช้) */
export function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

/** Hash backup codes เพื่อเก็บใน DB */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

/** ตรวจสอบว่า backup code ตรงกับ hashed codes ใน DB
 *  คืน index ที่ตรง หรือ -1 ถ้าไม่ตรง */
export async function verifyBackupCode(
  enteredCode: string,
  hashedCodes: string[]
): Promise<number> {
  const normalized = enteredCode.replace(/\s|-/g, '').toUpperCase();
  for (let i = 0; i < hashedCodes.length; i++) {
    const match = await bcrypt.compare(normalized, hashedCodes[i]);
    if (match) return i;
  }
  return -1;
}
