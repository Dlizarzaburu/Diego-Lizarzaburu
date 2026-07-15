import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/schemas";
import { handler, parseBody, ok, fail, limitOrThrow } from "@/lib/api";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  limitOrThrow(req, "login", { limit: 8, windowSec: 300 });
  const input = await parseBody(req, loginSchema);

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Constant-ish response to avoid user enumeration.
  const valid = user
    ? await verifyPassword(input.password, user.passwordHash)
    : false;

  if (!user || !valid) {
    return fail("Invalid email or password.", 401);
  }

  await createSession(user.id);
  await audit({ action: "auth.login", actorId: user.id });
  return ok({ id: user.id, name: user.name, role: user.role });
});
