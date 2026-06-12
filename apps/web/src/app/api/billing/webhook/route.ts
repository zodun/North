// Polar webhook → premium entitlement (BILLING-01).
// Verifies the signature (handled by the @polar-sh/nextjs adapter using
// POLAR_WEBHOOK_SECRET) and keeps public.subscriptions in sync with the Polar
// subscription lifecycle. Writes with the service role; the user is resolved
// from customer.externalId, which checkout sets to the North user id.

import { env } from "@north/env/server";
import { createServiceRoleClient } from "@north/supabase/server";
import { Webhooks } from "@polar-sh/nextjs";

// Structural subset of the Polar subscription payload we rely on.
type PolarSub = {
	id: string;
	status: string;
	productId?: string | null;
	customerId?: string | null;
	currentPeriodEnd?: string | Date | null;
	cancelAtPeriodEnd?: boolean | null;
	customer?: {
		id?: string | null;
		externalId?: string | null;
		email?: string | null;
	} | null;
};

// Map Polar's status (+ event override) to our coarse entitlement status.
function resolveStatus(
	data: PolarSub,
	override?: "canceled" | "revoked",
): "active" | "trialing" | "canceled" | "revoked" | "inactive" {
	if (override) return override;
	if (data.status === "active")
		return data.cancelAtPeriodEnd ? "canceled" : "active";
	if (data.status === "trialing") return "trialing";
	if (data.status === "canceled") return "canceled";
	// past_due / unpaid / incomplete / incomplete_expired → no access.
	return "revoked";
}

async function syncSubscription(
	data: PolarSub,
	override?: "canceled" | "revoked",
) {
	const userId = data.customer?.externalId;
	if (!userId) {
		// No external id means we can't map the customer to a North user.
		console.error("polar webhook: subscription without customer.externalId", {
			subscription: data.id,
		});
		return;
	}
	const supabase = createServiceRoleClient();
	const periodEnd = data.currentPeriodEnd
		? new Date(data.currentPeriodEnd).toISOString()
		: null;

	const { error } = await supabase.from("subscriptions").upsert(
		{
			user_id: userId,
			polar_customer_id: data.customerId ?? data.customer?.id ?? null,
			polar_subscription_id: data.id,
			product_id: data.productId ?? null,
			status: resolveStatus(data, override),
			current_period_end: periodEnd,
			cancel_at_period_end: data.cancelAtPeriodEnd ?? false,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "user_id" },
	);
	if (error) {
		console.error("polar webhook: subscriptions upsert failed", error.message);
		throw new Error(error.message);
	}
}

export const POST = env.POLAR_WEBHOOK_SECRET
	? Webhooks({
			webhookSecret: env.POLAR_WEBHOOK_SECRET,
			onSubscriptionActive: (p) => syncSubscription(p.data as PolarSub),
			onSubscriptionUpdated: (p) => syncSubscription(p.data as PolarSub),
			onSubscriptionCanceled: (p) =>
				syncSubscription(p.data as PolarSub, "canceled"),
			onSubscriptionRevoked: (p) =>
				syncSubscription(p.data as PolarSub, "revoked"),
		})
	: async () => new Response("billing is not configured", { status: 503 });
