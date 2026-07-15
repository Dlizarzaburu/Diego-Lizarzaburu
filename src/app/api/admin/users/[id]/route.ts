import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  route,
  parseBody,
  ok,
  fail,
  requireApiRole,
  type IdCtx,
} from "@/lib/api";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  action: z.enum([
    "approveCreator",
    "revokeCreator",
    "makeAdmin",
    "makeCustomer",
  ]),
});

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const admin = await requireApiRole("ADMIN");
  const { id } = await params;
  const { action } = await parseBody(req, bodySchema);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return fail("User not found.", 404);
  if (target.id === admin.id && action === "makeCustomer")
    return fail("You cannot demote yourself.", 400);

  const data = {
    approveCreator: {
      role: "CREATOR" as const,
      creatorStatus: "APPROVED" as const,
    },
    revokeCreator: {
      role: "CUSTOMER" as const,
      creatorStatus: "REVOKED" as const,
    },
    makeAdmin: { role: "ADMIN" as const, creatorStatus: "APPROVED" as const },
    makeCustomer: { role: "CUSTOMER" as const, creatorStatus: "NONE" as const },
  }[action];

  await prisma.user.update({ where: { id }, data });
  await audit({
    actorId: admin.id,
    action: `admin.user.${action}`,
    targetType: "user",
    targetId: id,
    metadata: { email: target.email },
  });
  return ok({ id, ...data });
});
