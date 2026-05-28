import type { CSSProperties } from "react";

export type IconName =
	| "compass"
	| "forYou"
	| "mission"
	| "signal"
	| "opportunities"
	| "profile"
	| "save"
	| "matters"
	| "pass"
	| "share"
	| "check"
	| "circle"
	| "circleDot"
	| "arrow"
	| "arrowUp"
	| "arrowDown"
	| "arrowRight"
	| "flat"
	| "close"
	| "settings"
	| "sparkle"
	| "pause"
	| "book"
	| "play"
	| "voice"
	| "spark"
	| "globe"
	| "leaf"
	| "mic"
	| "pen"
	| "lock"
	| "eye"
	| "bell";

type Props = {
	name: IconName;
	size?: number;
	stroke?: string;
	fill?: string;
	strokeWidth?: number;
	style?: CSSProperties;
};

export function Icon({
	name,
	size = 22,
	stroke = "currentColor",
	fill = "none",
	strokeWidth = 1.5,
	style,
}: Props) {
	const c = stroke;
	const sw = strokeWidth;
	const common = {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill,
		stroke: c,
		strokeWidth: sw,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		style,
	};

	switch (name) {
		case "compass":
			return (
				<svg {...common}>
					<circle cx="12" cy="12" r="9" />
					<path d="M15 9l-1.5 4.5L9 15l1.5-4.5L15 9z" fill={c} stroke="none" />
				</svg>
			);
		case "forYou":
			return (
				<svg {...common}>
					<path d="M12 2l1.6 7L21 12l-7.4 3L12 22l-1.6-7L3 12l7.4-3z" />
				</svg>
			);
		case "mission":
			return (
				<svg {...common}>
					<circle cx="12" cy="12" r="9" />
					<circle cx="12" cy="12" r="4" />
					<circle cx="12" cy="12" r="1" fill={c} stroke="none" />
				</svg>
			);
		case "signal":
			return (
				<svg {...common}>
					<path d="M3 18l4-6 4 3 4-8 6 11" />
				</svg>
			);
		case "opportunities":
			return (
				<svg {...common}>
					<path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" />
				</svg>
			);
		case "profile":
			return (
				<svg {...common}>
					<circle cx="12" cy="8" r="4" />
					<path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
				</svg>
			);
		case "save":
			return (
				<svg {...common}>
					<path d="M6 4h12v17l-6-4-6 4z" />
				</svg>
			);
		case "matters":
			return (
				<svg {...common}>
					<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
				</svg>
			);
		case "pass":
			return (
				<svg {...common}>
					<path d="M4 12h16" />
				</svg>
			);
		case "share":
			return (
				<svg {...common}>
					<path d="M12 4v12M12 4l-4 4M12 4l4 4M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" />
				</svg>
			);
		case "check":
			return (
				<svg {...common}>
					<path d="M5 12l5 5 9-11" />
				</svg>
			);
		case "circle":
			return (
				<svg {...common}>
					<circle cx="12" cy="12" r="9" />
				</svg>
			);
		case "circleDot":
			return (
				<svg {...common}>
					<circle cx="12" cy="12" r="9" />
					<circle cx="12" cy="12" r="3" fill={c} stroke="none" />
				</svg>
			);
		case "arrow":
			return (
				<svg {...common}>
					<path d="M5 12h14M13 5l7 7-7 7" />
				</svg>
			);
		case "arrowUp":
			return (
				<svg {...common}>
					<path d="M12 19V5M5 12l7-7 7 7" />
				</svg>
			);
		case "arrowDown":
			return (
				<svg {...common}>
					<path d="M12 5v14M5 12l7 7 7-7" />
				</svg>
			);
		case "arrowRight":
			return (
				<svg {...common}>
					<path d="M7 17L17 7M17 7H9M17 7V15" />
				</svg>
			);
		case "flat":
			return (
				<svg {...common}>
					<path d="M5 12h14" />
				</svg>
			);
		case "close":
			return (
				<svg {...common}>
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			);
		case "settings":
			return (
				<svg {...common}>
					<circle cx="12" cy="12" r="3" />
					<path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
				</svg>
			);
		case "sparkle":
			return (
				<svg {...common}>
					<path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4z" />
				</svg>
			);
		case "pause":
			return (
				<svg {...common}>
					<rect x="7" y="5" width="3" height="14" />
					<rect x="14" y="5" width="3" height="14" />
				</svg>
			);
		case "book":
			return (
				<svg {...common}>
					<path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 01-2-2V5z" />
					<path d="M20 5a2 2 0 00-2-2h-6v18h6a2 2 0 002-2V5z" />
				</svg>
			);
		case "play":
			return (
				<svg {...common}>
					<path d="M7 5v14l11-7z" />
				</svg>
			);
		case "voice":
			return (
				<svg {...common}>
					<rect x="9" y="3" width="6" height="12" rx="3" />
					<path d="M5 11a7 7 0 0014 0M12 18v3" />
				</svg>
			);
		case "spark":
			return (
				<svg {...common}>
					<path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
				</svg>
			);
		case "globe":
			return (
				<svg {...common}>
					<circle cx="12" cy="12" r="9" />
					<path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
				</svg>
			);
		case "leaf":
			return (
				<svg {...common}>
					<path d="M20 4c0 8-6 14-14 14M20 4c-8 0-14 6-14 14M6 18l-2 2" />
				</svg>
			);
		case "mic":
			return (
				<svg {...common}>
					<rect x="9" y="3" width="6" height="12" rx="3" />
					<path d="M5 11a7 7 0 0014 0" />
				</svg>
			);
		case "pen":
			return (
				<svg {...common}>
					<path d="M14 4l6 6-11 11H3v-6L14 4z" />
				</svg>
			);
		case "lock":
			return (
				<svg {...common}>
					<rect x="5" y="11" width="14" height="10" rx="2" />
					<path d="M8 11V8a4 4 0 018 0v3" />
				</svg>
			);
		case "eye":
			return (
				<svg {...common}>
					<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
					<circle cx="12" cy="12" r="3" />
				</svg>
			);
		case "bell":
			return (
				<svg {...common}>
					<path d="M6 18h12l-1.5-2V11a4.5 4.5 0 00-9 0v5L6 18zM10 21a2 2 0 004 0" />
				</svg>
			);
		default:
			return (
				<svg {...common}>
					<circle cx="12" cy="12" r="9" />
				</svg>
			);
	}
}
