"use client";

import { usePathname } from "next/navigation";

// 5-tab warm bottom nav: For You · Mission · Opportunities · Journal · Community.
// The old centre video-upload button and the Profile tab are gone — upload now
// lives in the For You header (see ProductShell) and Profile is reached via the
// top-right avatar present on every tab page.

const GOLD = "#C47D00";
const INACTIVE = "rgba(26,18,8,0.3)";

type TabDef = {
	href: string;
	label: string;
	icon: (props: { color: string }) => React.ReactElement;
};

const TABS: TabDef[] = [
	{ href: "/for-you", label: "For You", icon: CompassIcon },
	{ href: "/mission", label: "Mission", icon: MissionIcon },
	{ href: "/opportunities", label: "Opportunities", icon: DocumentIcon },
	{ href: "/journal", label: "Journal", icon: ChatIcon },
	{ href: "/community", label: "Community", icon: GridIcon },
];

export function TabBar() {
	const pathname = usePathname();

	return (
		<nav
			className="fixed right-0 bottom-0 left-0 z-40 flex items-stretch pt-2 pb-[max(6px,env(safe-area-inset-bottom))] backdrop-blur-xl"
			style={{
				background: "rgba(245,240,232,0.97)",
				borderTop: "1px solid rgba(26,18,8,0.08)",
			}}
		>
			{TABS.map((tab) => {
				const active = pathname.startsWith(tab.href);
				const Icon = tab.icon;
				const color = active ? GOLD : INACTIVE;
				return (
					<a
						key={tab.href}
						href={tab.href}
						aria-label={tab.label}
						aria-current={active ? "page" : undefined}
						className="flex flex-1 cursor-pointer flex-col items-center gap-[2px]"
					>
						<Icon color={color} />
						<span
							className="font-semibold text-[8px] tracking-wide"
							style={{ color }}
						>
							{tab.label}
						</span>
						<span
							className="h-[3px] w-[3px] rounded-full"
							style={{ background: active ? GOLD : "transparent" }}
						/>
					</a>
				);
			})}
		</nav>
	);
}

// ── Icons (stroke driven by `color`) ─────────────────────────────────────────
function base(color: string) {
	return {
		width: 22,
		height: 22,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth: 1.7,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
}

function CompassIcon({ color }: { color: string }) {
	return (
		<svg {...base(color)} aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M15.5 8.5l-2 5-5 2 2-5z" fill={color} stroke="none" />
		</svg>
	);
}

function MissionIcon({ color }: { color: string }) {
	return (
		<svg {...base(color)} aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M8.5 12.2l2.3 2.3 4.7-4.7" />
		</svg>
	);
}

function DocumentIcon({ color }: { color: string }) {
	return (
		<svg {...base(color)} aria-hidden="true">
			<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
			<path d="M14 3v5h5M9 13h6M9 17h6" />
		</svg>
	);
}

function ChatIcon({ color }: { color: string }) {
	return (
		<svg {...base(color)} aria-hidden="true">
			<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.6a8.4 8.4 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" />
		</svg>
	);
}

function GridIcon({ color }: { color: string }) {
	return (
		<svg {...base(color)} aria-hidden="true">
			<circle cx="8" cy="8" r="2.6" />
			<circle cx="16" cy="8" r="2.6" />
			<circle cx="8" cy="16" r="2.6" />
			<circle cx="16" cy="16" r="2.6" />
		</svg>
	);
}
