import { env } from "@north/env/native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Native Supabase client for Expo / React Native. Uses the anon key with
 * AsyncStorage so RLS applies per-user and sessions persist across launches.
 *
 * Pass the AsyncStorage default export from the host app to avoid forcing
 * @react-native-async-storage/async-storage as a hard dep on this package.
 */
export function createSupabaseNativeClient(asyncStorage: {
	getItem(key: string): Promise<string | null>;
	setItem(key: string, value: string): Promise<void>;
	removeItem(key: string): Promise<void>;
}): SupabaseClient {
	if (cached) return cached;
	cached = createClient(
		env.EXPO_PUBLIC_SUPABASE_URL,
		env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
		{
			auth: {
				storage: asyncStorage,
				autoRefreshToken: true,
				persistSession: true,
				detectSessionInUrl: false,
			},
		},
	);
	return cached;
}
