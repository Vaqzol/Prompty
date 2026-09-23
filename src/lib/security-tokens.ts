import 'server-only';
import { createHmac, createHash } from 'node:crypto';
export function digest(value: string) { return createHash('sha256').update(value).digest('hex'); }
export function signedDigest(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return createHmac('sha256', secret).update(value).digest('hex');
}
export function credentialVersion(hash: string) { return signedDigest('password:' + hash); }
export function mfaGrant(userId: string, sessionId: string, secret: string) {
  const identifier = 'mfa:' + userId + ':' + sessionId;
  return { identifier, token: digest(identifier + ':' + secret) };
}
export function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;
}
export function emailAddress(value: unknown): string {
  if (typeof value !== 'string') throw new Error('อีเมลไม่ถูกต้อง');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('อีเมลไม่ถูกต้อง');
  return email;
}
