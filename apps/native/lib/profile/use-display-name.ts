import { useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { MOCK_FIRST_NAME } from "../dev-mock";

// First name for greeting headers. Null while loading or when the
// profile has no display name — callers should render a nameless
// greeting rather than a placeholder.
export function useFirstName() {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [firstName, setFirstName] = useState<string | null>(null);

	useEffect(() => {
		if (bypass) {
			setFirstName(MOCK_FIRST_NAME);
			return;
		}
		if (!session) return;
		let cancelled = false;
		void supabase
			.from("profiles")
			.select("display_name")
			.eq("user_id", session.user.id)
			.maybeSingle<{ display_name: string | null }>()
			.then(({ data }) => {
				if (cancelled) return;
				const name = data?.display_name?.trim();
				setFirstName(name ? (name.split(/\s+/)[0] ?? null) : null);
			});
		return () => {
			cancelled = true;
		};
	}, [session, bypass]);

	return firstName;
}
