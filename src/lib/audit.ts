import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

/** Append-only record of sensitive actions (admin & creator operations). */
export async function audit(params: {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata,
        ip: params.ip ?? undefined,
      },
    });
  } catch {
    // Never let audit failures break the primary operation.
  }
}
