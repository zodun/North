// North's own focus-area glyphs — the same wayfinding set as the web
// onboarding (apps/web/src/app/onboarding/page.tsx FOCUS_GLYPHS), drawn
// on one grammar: 24-grid, single stroke weight, round caps. Artifacts
// from the trail: nib laying a stroke (craft), planted flag (venture),
// cairn (mind — steady), bridge (people — connect), kite (money — free),
// sprout with a deep taproot (learn — go deep).

import Svg, { Circle, Ellipse, Path } from "react-native-svg";

const GLYPH_PATHS: Record<string, React.ReactNode> = {
	craft: (
		<>
			<Path d="M7.5 4h9v4c0 1.5-.3 2.8-1.1 4.1L12 17.5l-3.4-5.4C7.8 10.8 7.5 9.5 7.5 8V4Z" />
			<Path d="M12 17.5v-5" />
			<Circle cx="12" cy="10.5" r="0.4" />
			<Path d="M6 20.8c4 .8 8 .6 12-.6" />
		</>
	),
	venture: (
		<>
			<Path d="M7 21V4" />
			<Path d="M7 4.8c2.8-1.6 5.6 1.6 8.5 0v6c-2.9 1.6-5.7-1.6-8.5 0" />
			<Path d="M4.5 21h5" />
		</>
	),
	mind: (
		<>
			<Ellipse cx="12" cy="5.4" rx="2.5" ry="2.1" />
			<Ellipse cx="12" cy="11" rx="4" ry="2.5" />
			<Ellipse cx="12" cy="17.5" rx="5.6" ry="3" />
		</>
	),
	people: (
		<>
			<Path d="M2.5 9h19" />
			<Path d="M5.5 16.5c0-4 2.9-6.5 6.5-6.5s6.5 2.5 6.5 6.5" />
			<Path d="M2.5 16.5h3M18.5 16.5h3" />
			<Path d="M4.5 20.5h15" />
		</>
	),
	money: (
		<>
			<Path d="M12 3l5.5 6.5L12 16 6.5 9.5 12 3Z" />
			<Path d="M12 3v13M6.5 9.5h11" />
			<Path d="M12 16c-.4 2.6-2.3 3.6-4.8 4.5" />
		</>
	),
	learn: (
		<>
			<Path d="M4 11.5h16" />
			<Path d="M12 20V6.5" />
			<Path d="M12 6.5c0-2.4 1.9-3.8 4.3-3.8 0 2.4-1.9 3.8-4.3 3.8Z" />
			<Path d="M12 9.5c0-1.8-1.4-2.9-3.2-2.9 0 1.8 1.4 2.9 3.2 2.9Z" />
			<Path d="M12 15.5c-2 .5-3.1 1.7-3.3 3.3" />
			<Path d="M12 15.5c2 .5 3.1 1.7 3.3 3.3" />
		</>
	),
};

export function FocusGlyph({
	id,
	color,
	size = 28,
}: {
	id: string;
	color: string;
	size?: number;
}) {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{GLYPH_PATHS[id]}
		</Svg>
	);
}
