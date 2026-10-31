import type { Request } from 'express';
import { writeAuditLog, type WriteAuditInput } from '../modules/audit/audit.service.js';

export type { WriteAuditInput };

export function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return req.ip || null;
}

/** Best-effort audit write — never throws to callers. */
export function recordAudit(
  input: WriteAuditInput,
): void {
  void writeAuditLog(input);
}

export function recordAuditFromRequest(
  req: Request,
  input: Omit<WriteAuditInput, 'tenantId' | 'actorId' | 'ipAddress'> & {
    tenantId: string;
    actorId?: string | null;
  },
): void {
  recordAudit({
    ...input,
    actorId: input.actorId ?? req.user?.id ?? null,
    ipAddress: clientIp(req),
  });
}
