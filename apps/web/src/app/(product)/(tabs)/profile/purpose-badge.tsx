"use client";

import { useState } from "react";
import { IdentityCrest } from "@/components/product/identity-crest";
import { supabase } from "@/lib/auth-client";
import { PURPOSE_MODES, type PurposeMode } from "@/lib/purpose";

// The profile home for the user's stance: the full crest worn large, with a
// quiet switch to change it. Writing the choice is a plain profiles update
// (RLS-allowed for the owner). Honoured, not gamified, no shame in switching.

const ON_VARIANT = "#424754";

const ORDER: PurposeMode[] = ["builder", "explorer"];

export function PurposeBadge({
	userId,
	initialMode,
}: {
	userId: string;
	initialMode: PurposeMode | null;
}) {
	const [mode, setMode] = useState<PurposeMode | null>(initialMode);

	async function choose(next: PurposeMode) {
		if (next === mode) return;
		setMode(next);
		await supabase
			.from("profiles")
			.update({ purpose_mode: next })
			.eq("user_id", userId);
	}

	return (
		<section className="mb-10">
			{mode ? (
				<IdentityCrest mode={mode} variant="full" className="mb-4" />
			) : (
				<p
					className="mb-3 font-bold text-[11px] uppercase tracking-[0.2em]"
					style={{ color: ON_VARIANT, opacity: 0.7 }}
				>
					Choose your stance
				</p>
			)}

			<div className="flex flex-wrap gap-2">
				{ORDER.map((id) => {
					const def = PURPOSE_MODES[id];
					const active = mode === id;
					return (
						<button
							key={id}
							type="button"
							aria-pressed={active}
							onClick={() => void choose(id)}
							className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-bold text-[12px] transition-colors"
							style={{
								color: active ? def.ink : ON_VARIANT,
								backgroundColor: active ? `${def.fill}24` : "transparent",
								borderColor: active ? `${def.fill}80` : "rgba(14,20,32,0.12)",
							}}
						>
							<span
								className="material-symbols-outlined"
								style={{
									fontSize: 16,
									fontVariationSettings: active
										? "'FILL' 1, 'wght' 700"
										: "'wght' 500",
								}}
							>
								{def.icon}
							</span>
							{def.title}
						</button>
					);
				})}
			</div>
		</section>
	);
}
