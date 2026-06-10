"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
	const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (localStorage.getItem("pwa-install-dismissed")) return;

		const handler = (e: Event) => {
			e.preventDefault();
			setPrompt(e as BeforeInstallPromptEvent);
		};

		window.addEventListener("beforeinstallprompt", handler);
		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	if (!prompt || dismissed) return null;

	const handleInstall = async () => {
		await prompt.prompt();
		const { outcome } = await prompt.userChoice;
		if (outcome === "accepted") setPrompt(null);
	};

	const handleDismiss = () => {
		localStorage.setItem("pwa-install-dismissed", "1");
		setDismissed(true);
	};

	return (
		<div className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
					<span className="text-lg">🧭</span>
				</div>
				<div className="flex-1">
					<p className="font-semibold text-sm text-white">
						Add North to your home screen
					</p>
					<p className="mt-0.5 text-xs text-zinc-400">
						Install for the full app experience
					</p>
					<div className="mt-3 flex gap-2">
						<button
							type="button"
							onClick={handleInstall}
							className="rounded-lg bg-white px-3 py-1.5 font-semibold text-black text-xs"
						>
							Install
						</button>
						<button
							type="button"
							onClick={handleDismiss}
							className="rounded-lg px-3 py-1.5 font-medium text-xs text-zinc-400"
						>
							Not now
						</button>
					</div>
				</div>
				<button
					type="button"
					onClick={handleDismiss}
					className="text-zinc-500 hover:text-zinc-300"
				>
					<X size={16} />
				</button>
			</div>
		</div>
	);
}
