// Icon set for the native surface (DEC-23) — the mockup icon system,
// drawn as 24-grid stroke glyphs in the app's own hand (1.5px default,
// round caps). Same `name`-prop API as the prototype's Icon.
//
// All renders use react-native-svg primitives; no web-only CSS.

import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
	// tab icons
	| "forYou"
	| "mission"
	| "signal"
	| "opportunities"
	| "profile"
	// UI glyphs
	| "arrow"
	| "arrowUp"
	| "arrowDown"
	| "arrowRight"
	| "flat"
	| "check"
	| "circleDot"
	| "add"
	| "close"
	| "search"
	| "bell"
	| "calendar"
	| "clock"
	| "settings"
	// surface glyphs (mission / journal / community sets)
	| "journal"
	| "community"
	| "flag"
	| "trophy"
	| "streak"
	| "write"
	| "voice"
	// status glyphs
	| "drift"
	| "onTrack"
	// feed interaction glyphs
	| "heart"
	| "heartFilled"
	| "bookmark"
	| "bookmarkFilled"
	| "share"
	| "externalLink";

export type IconProps = {
	name: IconName;
	size?: number;
	color?: string;
	strokeWidth?: number;
};

export function Icon({
	name,
	size = 22,
	color = "currentColor",
	strokeWidth = 1.5,
}: IconProps) {
	const common = {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};

	switch (name) {
		case "forYou":
			return (
				<Svg {...common}>
					<Path d="M12 2l1.6 7L21 12l-7.4 3L12 22l-1.6-7L3 12l7.4-3z" />
				</Svg>
			);
		case "mission":
			// Circle-check, per the mockup's main-nav Mission glyph.
			return (
				<Svg {...common}>
					<Circle cx="12" cy="12" r="9" />
					<Path d="M8 12.5l2.5 2.5 5.5-6" />
				</Svg>
			);
		case "signal":
			return (
				<Svg {...common}>
					<Path d="M3 18l4-6 4 3 4-8 6 11" />
				</Svg>
			);
		case "opportunities":
			// Briefcase, per the mockup's Opportunities glyph.
			return (
				<Svg {...common}>
					<Rect x="3" y="8" width="18" height="12" rx="2" />
					<Path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
					<Path d="M3 13h18" />
				</Svg>
			);
		case "profile":
			return (
				<Svg {...common}>
					<Circle cx="12" cy="8" r="4" />
					<Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
				</Svg>
			);
		case "arrow":
			return (
				<Svg {...common}>
					<Path d="M5 12h14M13 5l7 7-7 7" />
				</Svg>
			);
		case "arrowUp":
			return (
				<Svg {...common}>
					<Path d="M12 19V5M5 12l7-7 7 7" />
				</Svg>
			);
		case "arrowDown":
			return (
				<Svg {...common}>
					<Path d="M12 5v14M5 12l7 7 7-7" />
				</Svg>
			);
		case "arrowRight":
			return (
				<Svg {...common}>
					<Path d="M7 17L17 7M17 7H9M17 7V15" />
				</Svg>
			);
		case "flat":
			return (
				<Svg {...common}>
					<Path d="M5 12h14" />
				</Svg>
			);
		case "check":
			return (
				<Svg {...common}>
					<Path d="M5 12l5 5 9-11" />
				</Svg>
			);
		case "circleDot":
			return (
				<Svg {...common}>
					<Circle cx="12" cy="12" r="9" />
					<Circle cx="12" cy="12" r="3" fill={color} stroke="none" />
				</Svg>
			);
		case "add":
			return (
				<Svg {...common}>
					<Path d="M12 5v14M5 12h14" />
				</Svg>
			);
		case "close":
			return (
				<Svg {...common}>
					<Path d="M6 6l12 12M18 6L6 18" />
				</Svg>
			);
		case "search":
			return (
				<Svg {...common}>
					<Circle cx="11" cy="11" r="7" />
					<Path d="M21 21l-4.3-4.3" />
				</Svg>
			);
		case "bell":
			return (
				<Svg {...common}>
					<Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
					<Path d="M13.7 21a2 2 0 0 1-3.4 0" />
				</Svg>
			);
		case "calendar":
			return (
				<Svg {...common}>
					<Rect x="3" y="4" width="18" height="17" rx="2" />
					<Path d="M8 2v4M16 2v4M3 9h18" />
				</Svg>
			);
		case "clock":
			return (
				<Svg {...common}>
					<Circle cx="12" cy="12" r="9" />
					<Path d="M12 7v5l3 2" />
				</Svg>
			);
		case "settings":
			return (
				<Svg {...common}>
					<Circle cx="12" cy="12" r="3.5" />
					<Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" />
				</Svg>
			);
		case "journal":
			// Open book, per the mockup's Journal glyph.
			return (
				<Svg {...common}>
					<Path d="M12 6.5C10.4 4.9 8.2 4 5.7 4c-1 0-1.9.1-2.7.4v15.2c.8-.3 1.7-.4 2.7-.4 2.5 0 4.7.9 6.3 2.3 1.6-1.4 3.8-2.3 6.3-2.3 1 0 1.9.1 2.7.4V4.4C20.2 4.1 19.3 4 18.3 4c-2.5 0-4.7.9-6.3 2.5z" />
					<Path d="M12 6.5v15" />
				</Svg>
			);
		case "community":
			// Two people, per the mockup's Community glyph.
			return (
				<Svg {...common}>
					<Circle cx="9" cy="7.5" r="3.5" />
					<Path d="M2.5 20.5v-1.5a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5v1.5" />
					<Path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
					<Path d="M21.5 20.5v-1.5a4.5 4.5 0 0 0-3-4.2" />
				</Svg>
			);
		case "flag":
			return (
				<Svg {...common}>
					<Path d="M5 21V4" />
					<Path d="M5 4.5c4-2 6 2 10 0v9c-4 2-6-2-10 0" />
				</Svg>
			);
		case "trophy":
			return (
				<Svg {...common}>
					<Path d="M8 4h8v6a4 4 0 0 1-8 0z" />
					<Path d="M8 5.5H5V7a3 3 0 0 0 3 3M16 5.5h3V7a3 3 0 0 1-3 3" />
					<Path d="M12 14v3M8.5 20h7M10 17h4" />
				</Svg>
			);
		case "streak":
			return (
				<Svg {...common}>
					<Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
				</Svg>
			);
		case "write":
			return (
				<Svg {...common}>
					<Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
				</Svg>
			);
		case "voice":
			return (
				<Svg {...common}>
					<Path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
					<Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
				</Svg>
			);
		case "drift":
			return (
				<Svg {...common}>
					<Circle cx="12" cy="12" r="9" />
					<Path d="M8 12h7M12.5 8.5L16 12l-3.5 3.5" />
				</Svg>
			);
		case "onTrack":
			return (
				<Svg {...common}>
					<Circle cx="12" cy="12" r="9" />
					<Path d="M12 16V8M8.5 11.5L12 8l3.5 3.5" />
				</Svg>
			);
		case "heart":
			return (
				<Svg {...common}>
					<Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
				</Svg>
			);
		case "heartFilled":
			return (
				<Svg {...common} stroke="none">
					<Path
						d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
						fill={color}
					/>
				</Svg>
			);
		case "bookmark":
			return (
				<Svg {...common}>
					<Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
				</Svg>
			);
		case "bookmarkFilled":
			return (
				<Svg {...common} stroke="none">
					<Path
						d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
						fill={color}
					/>
				</Svg>
			);
		case "share":
			return (
				<Svg {...common}>
					<Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
					<Path d="M16 6l-4-4-4 4" />
					<Path d="M12 2v13" />
				</Svg>
			);
		case "externalLink":
			return (
				<Svg {...common}>
					<Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<Path d="M15 3h6v6" />
					<Path d="M10 14L21 3" />
				</Svg>
			);
	}
}
