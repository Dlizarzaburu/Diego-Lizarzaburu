import { prisma } from "@/lib/prisma";
import { promoInputSchema } from "@/lib/validation/schemas";
import {
  route,
  parseBody,
  ok,
  fail,
  requireApiRole,
  type IdCtx,
} from "@/lib/api";
import { assertEventAccess } from "@/server/access";
import { audit } from "@/lib/audit";

export const POST = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  await assertEventAccess(id, user);
  const input = await parseBody(req, promoInputSchema);

  if (input.discountType === "PERCENT" && input.amount > 100)
    return fail("Percentage discount cannot exceed 100.", 422);

  const existing = await prisma.promoCode.findFirst({
    where: { eventId: id, code: input.code.toUpperCase() },
  });
  if (existing) return fail("A promo code with that name already exists.", 409);

  const promo = await prisma.promoCode.create({
    data: {
      eventId: id,
      code: input.code.toUpperCase(),
      discountType: input.discountType,
      amount: input.amount,
      maxUses: input.maxUses ?? null,
    },
  });
  await audit({
    actorId: user.id,
    action: "promo.create",
    targetType: "event",
    targetId: id,
    metadata: { code: promo.code },
  });
  return ok({ id: promo.id, code: promo.code });
});
