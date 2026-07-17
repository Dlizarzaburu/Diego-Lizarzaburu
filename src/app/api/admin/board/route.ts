import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, parseBody, ok, requireApiRole } from "@/lib/api";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  members: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Name is required").max(80),
        photoUrl: z
          .string()
          .trim()
          .url("Photo must be a valid URL")
          .or(z.literal(""))
          .optional(),
      }),
    )
    .max(24),
});

// Replace the whole executive-board list. Admins manage names and photo URLs
// from /admin/board; the homepage reads these rows.
export const PUT = handler(async (req) => {
  const admin = await requireApiRole("ADMIN");
  const { members } = await parseBody(req, bodySchema);

  await prisma.$transaction([
    prisma.boardMember.deleteMany({}),
    prisma.boardMember.createMany({
      data: members.map((m, i) => ({
        name: m.name,
        photoUrl: m.photoUrl ? m.photoUrl : null,
        sortOrder: i,
      })),
    }),
  ]);

  await audit({
    actorId: admin.id,
    action: "admin.board.update",
    metadata: { count: members.length },
  });
  return ok({ count: members.length });
});
