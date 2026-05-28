"use client";

import { Toaster } from "@north/ui/components/sonner";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState } from "react";

import { ThemeProvider } from "./theme-provider";

// PostHog auto-no-ops when the public key is missing, but we gate
// init() entirely so we don't ship a dead client when running against
// a dev environment without analytics wired.
function usePostHogClient() {
	const [client, setClient] = useState<typeof posthog | null>(null);
	useEffect(() => {
		const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
		if (!key) return;
		posthog.init(key, {
			api_host:
				process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
			capture_pageview: "history_change",
			autocapture: false,
			disable_session_recording: true,
		});
		setClient(posthog);
		return () => {
			posthog.reset();
		};
	}, []);
	return client;
}

export default function Providers({ children }: { children: React.ReactNode }) {
	const client = usePostHogClient();
	const wrappedInTheme = (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			{children}
			<Toaster richColors />
		</ThemeProvider>
	);
	if (!client) return wrappedInTheme;
	return <PostHogProvider client={client}>{wrappedInTheme}</PostHogProvider>;
}
