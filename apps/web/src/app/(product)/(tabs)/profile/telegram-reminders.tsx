"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/auth-client";

// Telegram reminders (NOTIF-03). "Connect" mints a one-time deep link
// (t.me/<bot>?start=<token>). We show it as a QR code so the user can open it
// on whichever device actually has Telegram (usually their phone), plus an
// open-here button and a copy fallback. Once the link is shown we poll the
// profile in the background, so the moment they tap Start in Telegram, and the
// webhook links the chat, this flips to "On" on its own, no extra tap.
// Connected users just toggle the channel (a plain profiles update, RLS-allowed).

const PRIMARY = "#005ac2";
const TELEGRAM = "#229ED9";
const ON_SURFACE = "#131313";
const ON_VARIANT = "#424754";
const SERIF = "'Libre Caslon Text', Georgia, serif";

// How long to keep watching for the tap before giving up (matches the link TTL).
const POLL_MS = 3000;
const POLL_WINDOW_MS = 15 * 60 * 1000;

type Frequency = "daily" | "weekdays" | "weekly";

const FREQUENCIES: { value: Frequency; label: string; hint: string }[] = [
	{ value: "daily", label: "Daily", hint: "Every morning" },
	{ value: "weekdays", label: "Weekdays", hint: "Mon to Fri" },
	{ value: "weekly", label: "Weekly", hint: "Mondays" },
];

export function TelegramReminders({
	userId,
	initialLinked,
	initialEnabled,
	initialFrequency = "daily",
}: {
	userId: string;
	initialLinked: boolean;
	initialEnabled: boolean;
	initialFrequency?: Frequency;
}) {
	const [linked, setLinked] = useState(initialLinked);
	const [enabled, setEnabled] = useState(initialEnabled);
	const [frequency, setFrequency] = useState<Frequency>(initialFrequency);
	const [linkUrl, setLinkUrl] = useState<string | null>(null);
	const [qrUrl, setQrUrl] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Watch for the link to complete while the QR is showing. The webhook sets
	// telegram_chat_id when the user taps Start; we catch it and flip to On.
	useEffect(() => {
		if (!linkUrl || linked) return;
		let active = true;
		const poll = async () => {
			const { data } = await supabase
				.from("profiles")
				.select("telegram_chat_id, telegram_opt_in")
				.eq("user_id", userId)
				.maybeSingle();
			if (!active || !data?.telegram_chat_id) return;
			setLinked(true);
			setEnabled(data.telegram_opt_in ?? true);
			setError(null);
		};
		const interval = window.setInterval(poll, POLL_MS);
		const stop = window.setTimeout(
			() => window.clearInterval(interval),
			POLL_WINDOW_MS,
		);
		return () => {
			active = false;
			window.clearInterval(interval);
			window.clearTimeout(stop);
		};
	}, [linkUrl, linked, userId]);

	async function connect() {
		if (busy) return;
		setBusy(true);
		setError(null);
		const { data, error: err } = await supabase.functions.invoke(
			"telegram-link",
			{ body: {} },
		);
		if (err || !data?.url) {
			setBusy(false);
			setError(data?.error ?? "Couldn't start the connection. Try again.");
			return;
		}
		const url = data.url as string;
		setLinkUrl(url);
		try {
			const png = await QRCode.toDataURL(url, {
				width: 240,
				margin: 1,
				color: { dark: "#0E1420", light: "#FFFFFF" },
			});
			setQrUrl(png);
		} catch {
			setQrUrl(null);
		}
		setBusy(false);
	}

	async function copyLink() {
		if (!linkUrl) return;
		try {
			await navigator.clipboard.writeText(linkUrl);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setError("Couldn't copy the link. Long-press it to copy instead.");
		}
	}

	async function toggle(next: boolean) {
		setEnabled(next);
		await supabase
			.from("profiles")
			.update({ telegram_opt_in: next })
			.eq("user_id", userId);
	}

	async function changeFrequency(next: Frequency) {
		if (next === frequency) return;
		setFrequency(next);
		await supabase
			.from("profiles")
			.update({ telegram_frequency: next })
			.eq("user_id", userId);
	}

	return (
		<div>
			<div className="mb-1 flex items-center gap-2">
				<span
					className="material-symbols-outlined text-xl"
					style={{ color: TELEGRAM }}
				>
					send
				</span>
				<h3
					className="font-bold text-xl tracking-tight"
					style={{ fontFamily: SERIF }}
				>
					Telegram reminders
				</h3>
			</div>
			<p
				className="mb-5 text-sm leading-relaxed"
				style={{ color: ON_VARIANT, opacity: 0.8 }}
			>
				Get your daily mission reminder on Telegram. Connect once and it pings
				your phone each morning.
			</p>

			{linked ? (
				<div className="flex flex-col gap-5">
					<div className="flex items-center justify-between gap-3">
						<p className="font-bold text-sm" style={{ color: ON_SURFACE }}>
							{enabled ? "On" : "Off"}
						</p>
						<button
							type="button"
							role="switch"
							aria-checked={enabled}
							aria-label="Telegram reminders"
							onClick={() => void toggle(!enabled)}
							className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
							style={{ background: enabled ? TELEGRAM : "rgba(14,20,32,0.15)" }}
						>
							<span
								className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
								style={{
									transform: enabled ? "translateX(22px)" : "translateX(2px)",
								}}
							/>
						</button>
					</div>

					{enabled && (
						<div>
							<p
								className="mb-2 font-bold text-[11px] uppercase tracking-[0.16em]"
								style={{ color: ON_VARIANT, opacity: 0.7 }}
							>
								How often
							</p>
							<div className="grid grid-cols-3 gap-1 rounded-2xl border border-black/10 bg-white p-1">
								{FREQUENCIES.map((f) => {
									const active = frequency === f.value;
									return (
										<button
											key={f.value}
											type="button"
											aria-pressed={active}
											onClick={() => void changeFrequency(f.value)}
											className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-colors"
											style={{
												background: active ? TELEGRAM : "transparent",
												color: active ? "#fff" : ON_SURFACE,
											}}
										>
											<span className="font-bold text-sm">{f.label}</span>
											<span
												className="text-[11px]"
												style={{
													color: active ? "rgba(255,255,255,0.85)" : ON_VARIANT,
													opacity: active ? 1 : 0.7,
												}}
											>
												{f.hint}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>
			) : linkUrl ? (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white p-5">
						{qrUrl ? (
							// biome-ignore lint/performance/noImgElement: inline data-URL QR, not a remote asset
							<img
								src={qrUrl}
								alt="QR code to connect Telegram"
								width={200}
								height={200}
								className="rounded-lg"
							/>
						) : (
							<div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-black/5" />
						)}
						<p
							className="text-center text-sm leading-relaxed"
							style={{ color: ON_VARIANT }}
						>
							<span className="font-bold" style={{ color: ON_SURFACE }}>
								Scan this with your phone camera
							</span>{" "}
							to open North in Telegram, then tap{" "}
							<span className="font-bold">Start</span>. This screen connects on
							its own the moment you do.
						</p>
					</div>

					<div
						className="flex items-center justify-center gap-2 text-sm"
						style={{ color: ON_VARIANT }}
						aria-live="polite"
					>
						<span
							className="inline-block h-3 w-3 animate-spin rounded-full border border-black/15 motion-reduce:animate-none"
							style={{ borderTopColor: TELEGRAM }}
							aria-hidden="true"
						/>
						Waiting for you to tap Start…
					</div>

					<div className="flex flex-col gap-2">
						<a
							href={linkUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-sm text-white"
							style={{ background: TELEGRAM }}
						>
							<span className="material-symbols-outlined text-lg">send</span>
							Open here (if Telegram is on this device)
						</a>
						<button
							type="button"
							onClick={() => void copyLink()}
							className="rounded-xl border border-black/10 bg-white px-5 py-2.5 font-bold text-sm transition-colors"
							style={{ color: PRIMARY }}
						>
							{copied ? "Link copied" : "Copy link"}
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => void connect()}
					disabled={busy}
					className="inline-flex w-fit items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm text-white uppercase tracking-wider disabled:opacity-40"
					style={{ background: TELEGRAM }}
				>
					<span className="material-symbols-outlined text-lg">send</span>
					{busy ? "Opening…" : "Connect Telegram"}
				</button>
			)}

			{error && (
				<p className="mt-3 font-semibold text-sm" style={{ color: "#ba1a1a" }}>
					{error}
				</p>
			)}
		</div>
	);
}
