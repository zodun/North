// Routing gate for onboarding.
//
//   'unauthenticated' — no session; render the existing welcome /
//                       sign-in screen
//   'onboarding'      — signed in but profiles.onboarded_at is null;
//                       redirect to /onboarding/1-name
//   'complete'        — render the drawer as normal
//   'loading'         — still resolving session or profile; hold

import { useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";

export type OnboardingStatus =
	| "loading"
	| "unauthenticated"
	| "onboarding"
	| "complete";

export function useOnboardingStatus(): OnboardingStatus {
	const bypassed = useAuthBypass();
	const { data: session, isPending: sessionPending } = useSession();
	const [profileOnboardedAt, setProfileOnboardedAt] = useState<
		string | null | undefined
	>(undefined);

	useEffect(() => {
		if (!session) {
			setProfileOnboardedAt(undefined);
			return;
		}
		let cancelled = false;
		supabase
			.from("profiles")
			.select("onboarded_at")
			.eq("user_id", session.user.id)
			.maybeSingle()
			.then(({ data }) => {
				if (cancelled) return;
				setProfileOnboardedAt(data?.onboarded_at ?? null);
			});
		return () => {
			cancelled = true;
		};
	}, [session]);

	// Dev-only preview path (no-op in release builds).
	if (bypassed) return "complete";
	if (sessionPending) return "loading";
	if (!session) return "unauthenticated";
	if (profileOnboardedAt === undefined) return "loading";
	if (profileOnboardedAt === null) return "onboarding";
	return "complete";
}
