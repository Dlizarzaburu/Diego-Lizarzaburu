import { checkoutSchema } from "@/lib/validation/schemas";
import {
  handler,
  parseBody,
  ok,
  fail,
  limitOrThrow,
  requireApiUser,
} from "@/lib/api";
import { createPendingOrder, OrderError } from "@/server/orders";

export const POST = handler(async (req) => {
  limitOrThrow(req, "checkout", { limit: 20, windowSec: 60 });
  const user = await requireApiUser();
  const input = await parseBody(req, checkoutSchema);

  try {
    const { order, intent } = await createPendingOrder(user.id, input);
    return ok({
      orderId: order.id,
      amountCents: order.totalCents,
      clientSecret: intent.clientSecret,
      provider: intent.provider,
    });
  } catch (e) {
    if (e instanceof OrderError) return fail(e.message, 409, { code: e.code });
    throw e;
  }
});
