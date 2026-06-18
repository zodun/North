import { PURPOSE_MODES, type PurposeMode } from "@/lib/purpose";

// The identity crest. A ringed medallion the user earns at onboarding and wears
// across the app. Built to North doctrine: flat, hairline rings, color rationed
// to the stance's one meaning, depth from tint not shadow. Presentational only.

const ON_SURFACE = "#131313";
const ON_VARIANT = "#424754";
const SERIF = "'Libre Caslon Text', Georgia, serif";

// The medallion on its own: two concentric hairline rings in the stance colour
// with the stance icon at the centre. Sizes scale the whole mark.
function Medallion({ mode, size }: { mode: PurposeMode; size: number }) {
	const def = PURPOSE_MODES[mode];
	const icon = Math.round(size * 0.42);
	return (
		<span
			className="relative inline-flex shrink-0 items-center justify-center rounded-full"
			style={{
				width: size,
				height: size,
				background: `${def.fill}1F`,
				border: `1.5px solid ${def.fill}80`,
			}}
		>
			{/* Inner hairline ring, the "minted" double edge that reads as a seal. */}
			<span
				aria-hidden="true"
				className="absolute rounded-full"
				style={{
					inset: Math.max(3, Math.round(size * 0.11)),
					border: `1px solid ${def.fill}59`,
				}}
			/>
			<span
				className="material-symbols-outlined relative"
				style={{
					color: def.ink,
					fontSize: icon,
					fontVariationSettings: "'FILL' 1, 'wght' 600",
				}}
			>
				{def.icon}
			</span>
		</span>
	);
}

export function IdentityCrest({
	mode,
	variant = "full",
	className = "",
}: {
	mode: PurposeMode;
	variant?: "full" | "compact";
	className?: string;
}) {
	const def = PURPOSE_MODES[mode];

	if (variant === "compact") {
		// A quiet insignia for the operating loop: medallion + "Moving as a ...".
		return (
			<span className={`inline-flex items-center gap-2.5 ${className}`}>
				<Medallion mode={mode} size={30} />
				<span
					className="font-bold text-[11px] uppercase tracking-[0.16em]"
					style={{ color: def.ink }}
				>
					{def.moving}
				</span>
			</span>
		);
	}

	return (
		<div className={`flex items-center gap-4 ${className}`}>
			<Medallion mode={mode} size={64} />
			<div className="min-w-0">
				<p
					className="mb-1 font-bold text-[10px] uppercase tracking-[0.2em]"
					style={{ color: def.ink }}
				>
					{def.eyebrow}
				</p>
				<p
					className="font-black text-2xl leading-none tracking-tight"
					style={{ color: ON_SURFACE, fontFamily: SERIF }}
				>
					{def.title}
				</p>
				<p
					className="mt-1.5 text-[13px] leading-snug"
					style={{ color: ON_VARIANT }}
				>
					{def.creed}
				</p>
			</div>
		</div>
	);
}
