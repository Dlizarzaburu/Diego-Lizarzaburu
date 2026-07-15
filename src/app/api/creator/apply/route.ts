import { prisma } from "@/lib/prisma";
import { handler, ok, fail, requireApiUser } from "@/lib/api";
import { audit } from "@/lib/audit";

// Any customer can apply to become an approved S27 organizer. An admin reviews
// and approves the request from the admin dashboard.
export const POST = handler(async () => {
  const user = await requireApiUser();
  if (user.role !== "CUSTOMER")
    return fail("You already have organizer access.", 400);
  if (user.creatorStatus === "PENDING")
    return fail("Your application is already pending review.", 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { creatorStatus: "PENDING" },
  });
  await audit({ actorId: user.id, action: "creator.apply" });
  return ok({ status: "PENDING" });
});
