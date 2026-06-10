"use client";

import { usePathname } from "next/navigation";

type TabDef = {
	href: string;
	label: string;
	icon: (props: { active: boolean; center?: boolean }) => React.ReactElement;
	center?: boolean;
};

const TABS: TabDef[] = [
	{ href: "/for-you", label: "For You", icon: ForYouIcon },
	{ href: "/opportunities", label: "Open", icon: OpportunitiesIcon },
	{ href: "/mission", label: "Mission", icon: MissionIcon, center: true },
	{ href: "/signal", label: "Signal", icon: SignalIcon },
	{ href: "/profile", label: "You", icon: ProfileIcon },
];

export function TabBar() {
	const pathname = usePathname();

	return (
		<nav className="fixed right-0 bottom-0 left-0 z-40 flex items-end justify-around border-white/8 border-t bg-[#0a0a0a]/95 px-2 pt-2 pb-safe backdrop-blur-xl">
			{TABS.map((tab) => {
				const active = pathname.startsWith(tab.href);
				const IconComponent = tab.icon;

				if (tab.center) {
					return (
						<a
							key={tab.href}
							href={tab.href}
							className="relative -mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white shadow-lg shadow-white/10"
						>
							<IconComponent active={false} center />
						</a>
					);
				}

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

function MissionIcon({ center }: { active?: boolean; center?: boolean }) {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke={center ? "#000" : "#fff"}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<path
				d="M15 9l-1.5 4.5L9 15l1.5-4.5L15 9z"
				fill={center ? "#000" : "#fff"}
				stroke="none"
			/>
		</svg>
	);
}

function SignalIcon({ active }: { active: boolean }) {
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
			<path d="M3 20v-4m4 4v-7m4 4v-8m4 8V4m4 16V9" />
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
