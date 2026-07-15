import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { performResetSchema } from "@/lib/validation/schemas";
import { handler, parseBody, ok, fail, limitOrThrow } from "@/lib/api";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  limitOrThrow(req, "reset", { limit: 10, windowSec: 600 });
  const { token, password } = await parseBody(req, performResetSchema);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("This reset link is invalid or has expired.", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate existing sessions after a password change.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  await audit({ action: "auth.reset", actorId: record.userId });
  return ok({ message: "Password updated. You can now sign in." });
});
