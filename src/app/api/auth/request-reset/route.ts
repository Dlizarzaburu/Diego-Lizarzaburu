import { prisma } from "@/lib/prisma";
import { randomToken } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { requestResetSchema } from "@/lib/validation/schemas";
import { handler, parseBody, ok, limitOrThrow } from "@/lib/api";

export const POST = handler(async (req) => {
  limitOrThrow(req, "reset-request", { limit: 5, windowSec: 600 });
  const { email } = await parseBody(req, requestResetSchema);

  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond the same way — never reveal whether the account exists.
  if (user) {
    const token = randomToken(32);
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    const { subject, html } = passwordResetEmail({
      name: user.name,
      resetUrl: `${env.appUrl}/reset?token=${token}`,
    });
    await sendEmail({ to: user.email, subject, html });
  }

  return ok({
    message: "If an account exists for that email, a reset link has been sent.",
  });
});
