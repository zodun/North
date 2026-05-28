import { createSupabaseNativeClient } from "@north/supabase/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const supabase = createSupabaseNativeClient(AsyncStorage);

export function useSession() {
	const [session, setSession] = useState<Session | null>(null);
	const [isPending, setIsPending] = useState(true);

	useEffect(() => {
		let cancelled = false;
		supabase.auth.getSession().then(({ data }) => {
			if (cancelled) return;
			setSession(data.session);
			setIsPending(false);
		});
		const { data } = supabase.auth.onAuthStateChange((_event, next) => {
			setSession(next);
		});
		return () => {
			cancelled = true;
			data.subscription.unsubscribe();
		};
	}, []);

	return { data: session, isPending };
}
