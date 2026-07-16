import { prisma } from "@/lib/prisma";
import { route, fail, requireApiUser, type IdCtx } from "@/lib/api";

// Apple Wallet pass endpoint.
//
// A real .pkpass must be a ZIP signed with an Apple "Pass Type ID" certificate
// plus the Apple WWDR certificate. Those are account-specific secrets, so this
// route is wired end-to-end but only emits a signed pass once the certificates
// are provided via env vars:
//   APPLE_WALLET_PASS_TYPE_ID, APPLE_WALLET_TEAM_ID,
//   APPLE_WALLET_CERT (base64 .p12), APPLE_WALLET_CERT_PASSWORD, APPLE_WALLET_WWDR
// The ticket's QR token is what would be embedded as the pass barcode message —
// still no personal data on the barcode itself.
export const GET = route<IdCtx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { event: true, tier: true },
  });
  if (!ticket || ticket.userId !== user.id)
    return fail("Ticket not found.", 404);

  const configured =
    !!process.env.APPLE_WALLET_PASS_TYPE_ID && !!process.env.APPLE_WALLET_CERT;

  if (!configured) {
    return fail(
      "Apple Wallet passes need an Apple Developer Pass certificate. Ask the admin to add the APPLE_WALLET_* environment variables, then this button will download a .pkpass.",
      501,
    );
  }

  // TODO: build pass.json (eventTicket) + assets, zip, and sign with the
  // configured certificate, then return the .pkpass bytes:
  //   headers: { "Content-Type": "application/vnd.apple.pkpass" }
  return fail("Apple Wallet pass signing is not yet enabled.", 501);
});
