import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/schemas";
import { handler, parseBody, ok, fail, limitOrThrow } from "@/lib/api";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  limitOrThrow(req, "register", { limit: 10, windowSec: 600 });
  const input = await parseBody(req, registerSchema);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) return fail("An account with this email already exists.", 409);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: "CUSTOMER",
    },
  });

  await createSession(user.id);
  await audit({ action: "auth.register", actorId: user.id, targetId: user.id });
  return ok({ id: user.id, name: user.name, role: user.role });
});
