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
	| "circleDot";

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
	}
}
