import { UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
export function isAdmin(key: unknown): boolean {
  const expected = process.env.WEDDING_ADMIN_KEY;
  if (!expected || typeof key !== 'string' || key.length > 256) return false;
  const a = Buffer.from(key), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function requireAdmin(key: unknown) { if (!isAdmin(key)) throw new UnauthorizedException('Неверный пароль.'); }
