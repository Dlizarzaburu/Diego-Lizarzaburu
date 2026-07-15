import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, parseBody, ok, requireApiRole } from "@/lib/api";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  platformFeeBps: z.number().int().min(0).max(3000),
  processingFeeBps: z.number().int().min(0).max(3000),
  processingFeeFixedCents: z.number().int().min(0).max(1000),
});

export const PATCH = handler(async (req) => {
  const admin = await requireApiRole("ADMIN");
  const input = await parseBody(req, bodySchema);
  const settings = await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    update: input,
    create: { id: "singleton", ...input },
  });
  await audit({
    actorId: admin.id,
    action: "admin.settings.update",
    metadata: input,
  });
  return ok(settings);
});
