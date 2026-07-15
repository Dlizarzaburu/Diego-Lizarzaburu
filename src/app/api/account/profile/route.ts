import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validation/schemas";
import { handler, parseBody, ok, requireApiUser } from "@/lib/api";

export const PATCH = handler(async (req) => {
  const user = await requireApiUser();
  const input = await parseBody(req, updateProfileSchema);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: input.name, phone: input.phone || null },
  });
  return ok({ name: updated.name, phone: updated.phone });
});
