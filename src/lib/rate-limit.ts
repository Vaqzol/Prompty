import 'server-only';
import { prisma } from '@/lib/prisma';
import { digest } from './security-tokens';

export class RateLimitError extends Error {
  constructor(public retryAfter: number) { super('ทำรายการบ่อยเกินไป กรุณารอแล้วลองใหม่'); }
}
// One atomic PostgreSQL upsert. A stable key resets its window rather than adding rows per request.
// Reuses SystemSetting so existing installations do not need a destructive schema migration.
export async function rateLimit(scope: string, subject: string, limit: number, seconds: number) {
  const key = '__rate:' + scope + ':' + digest(subject);
  const rows = await prisma.$queryRaw<Array<{ value: string }>>`
    INSERT INTO "SystemSetting" ("key", "value", "updatedAt")
    VALUES (${key}, jsonb_build_object('count', 1, 'until', extract(epoch from clock_timestamp()) + ${seconds}::int)::text, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "value" = CASE WHEN (("SystemSetting"."value"::jsonb)->>'until')::numeric <= extract(epoch from clock_timestamp())
        THEN jsonb_build_object('count', 1, 'until', extract(epoch from clock_timestamp()) + ${seconds}::int)::text
        ELSE jsonb_set("SystemSetting"."value"::jsonb, '{count}', to_jsonb(LEAST((("SystemSetting"."value"::jsonb)->>'count')::int + 1, ${limit + 1}::int)))::text END,
      "updatedAt" = NOW()
    RETURNING "value"
  `;
  const state = JSON.parse(rows[0].value) as {count: number; until: number};
  if (state.count > limit) throw new RateLimitError(Math.max(1, Math.ceil(state.until - Date.now()/1000)));
}
