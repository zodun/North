"use client";

import { usePathname } from "next/navigation";

type TabDef = {
	href: string;
	label: string;
	icon: (props: { active: boolean }) => React.ReactElement;
};

const LEFT_TABS: TabDef[] = [
	{ href: "/for-you", label: "For You", icon: ForYouIcon },
	{ href: "/opportunities", label: "Open", icon: OpportunitiesIcon },
];

const RIGHT_TABS: TabDef[] = [
	{ href: "/mission", label: "Task", icon: MissionIcon },
	{ href: "/profile", label: "You", icon: ProfileIcon },
];

export function TabBar({ onUpload }: { onUpload: () => void }) {
	const pathname = usePathname();

	return (
		<nav className="fixed right-0 bottom-0 left-0 z-40 flex items-end justify-around border-white/8 border-t bg-[#0a0a0a]/95 px-2 pt-2 pb-safe backdrop-blur-xl">
			{/* Left two tabs */}
			{LEFT_TABS.map((tab) => {
				const active = pathname.startsWith(tab.href);
				const IconComponent = tab.icon;
				return (
					<a
						key={tab.href}
						href={tab.href}
						className="flex flex-1 flex-col items-center gap-1 py-1"
					>
						<IconComponent active={active} />
						<span
							className={`font-medium text-[10px] tracking-wide transition-colors ${
								active ? "text-white" : "text-white/40"
							}`}
						>
							{tab.label}
						</span>
					</a>
				);
			})}

			{/* Centre upload button */}
			<div className="relative flex flex-1 items-end justify-center">
				<button
					type="button"
					onClick={onUpload}
					aria-label="Post content"
					className="relative -mt-5 flex h-[58px] w-[58px] cursor-pointer items-center justify-center rounded-full shadow-[0_4px_24px_rgba(245,200,66,0.5)] transition-transform active:scale-95"
					style={{
						background: "linear-gradient(135deg, #F5C842 0%, #FFD966 100%)",
					}}
				>
					{/* Outer ring */}
					<span
						aria-hidden="true"
						className="pointer-events-none absolute inset-[-3px] rounded-full border border-[#F5C842]/30"
					/>
					<UploadIcon />
				</button>
			</div>

			{/* Right two tabs */}
			{RIGHT_TABS.map((tab) => {
				const active = pathname.startsWith(tab.href);
				const IconComponent = tab.icon;
				return (
					<a
						key={tab.href}
						href={tab.href}
						className="flex flex-1 flex-col items-center gap-1 py-1"
					>
						<IconComponent active={active} />
						<span
							className={`font-medium text-[10px] tracking-wide transition-colors ${
								active ? "text-white" : "text-white/40"
							}`}
						>
							{tab.label}
						</span>
					</a>
				);
			})}
		</nav>
	);
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ForYouIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke={active ? "#fff" : "rgba(255,255,255,0.4)"}
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 2l1.6 7L21 12l-7.4 3L12 22l-1.6-7L3 12l7.4-3z" />
		</svg>
	);
}

function OpportunitiesIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke={active ? "#fff" : "rgba(255,255,255,0.4)"}
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="M21 21l-4.35-4.35" />
		</svg>
	);
}

function UploadIcon() {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#05050E"
			strokeWidth={2.2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 16V8M8 12l4-4 4 4" />
			<path d="M20 16.5A4.5 4.5 0 0 1 15.5 21h-7A4.5 4.5 0 0 1 4 16.5" />
		</svg>
	);
}

function MissionIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke={active ? "#fff" : "rgba(255,255,255,0.4)"}
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<path
				d="M15 9l-1.5 4.5L9 15l1.5-4.5L15 9z"
				fill={active ? "#fff" : "rgba(255,255,255,0.4)"}
				stroke="none"
			/>
		</svg>
	);
}

function ProfileIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke={active ? "#fff" : "rgba(255,255,255,0.4)"}
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="8" r="4" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
		</svg>
	);
}
