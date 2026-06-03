// Icon set for the v0 native surface (DEC-23). Subset of the
// prototype's `Icon` (apps/web/src/app/north/_components/icon.tsx) —
// only the names actually used on native: tab icons + sparse UI
// glyphs (arrows, check, circleDot). Same `name`-prop API.
//
// All renders use react-native-svg primitives; no web-only CSS.

import Svg, { Circle, Path } from "react-native-svg";

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
			return (
				<Svg {...common}>
					<Circle cx="12" cy="12" r="9" />
					<Circle cx="12" cy="12" r="4" />
					<Circle cx="12" cy="12" r="1" fill={color} stroke="none" />
				</Svg>
			);
		case "signal":
			return (
				<Svg {...common}>
					<Path d="M3 18l4-6 4 3 4-8 6 11" />
				</Svg>
			);
		case "opportunities":
			return (
				<Svg {...common}>
					<Path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" />
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
