// Sparkline — port of the prototype's Signal-tab sparkline (DEC-23).
// Smoothed quadratic-bezier line over 0-100 scores, with a gradient
// area fill underneath. linearGradient `id` is per-instance via
// React.useId() because react-native-svg has no global <defs> scope.

import type { Palette } from "@north/tokens";
import { useId } from "react";
import Svg, {
	Circle,
	Defs,
	Line,
	LinearGradient,
	Path,
	Stop,
} from "react-native-svg";

export type SparklineProps = {
	p: Palette;
	data: ReadonlyArray<{ score: number }>;
	accent?: string;
	height?: number;
	width?: number;
};

export function Sparkline({
	p,
	data,
	accent,
	height = 64,
	width = 280,
}: SparklineProps) {
	const gradId = useId();
	const stroke = accent ?? p.accent;
	const pad = 4;
	const w = width - pad * 2;
	const h = height - pad * 2;

	if (data.length === 0) return null;

	const pts = data.map((d, i) => {
		const x = pad + (i / Math.max(1, data.length - 1)) * w;
		const y = pad + h - (d.score / 100) * h;
		return [x, y] as const;
	});

	const pathD = pts.reduce<string>((acc, [x, y], i) => {
		if (i === 0) return `M${x},${y}`;
		const prev = pts[i - 1];
		if (!prev) return acc;
		const [px, py] = prev;
		const cx = (px + x) / 2;
		return `${acc} Q${cx},${py} ${cx},${(py + y) / 2} T${x},${y}`;
	}, "");

	const last = pts[pts.length - 1];
	const first = pts[0];
	if (!last || !first) return null;
	const fillD = `${pathD} L${last[0]},${height} L${first[0]},${height} Z`;

	return (
		<Svg width={width} height={height}>
			<Defs>
				<LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
					<Stop offset="100%" stopColor={stroke} stopOpacity={0} />
				</LinearGradient>
			</Defs>
			{[20, 40, 60, 80].map((tick) => (
				<Line
					key={tick}
					x1={pad}
					x2={width - pad}
					y1={pad + h - (tick / 100) * h}
					y2={pad + h - (tick / 100) * h}
					stroke={p.line}
					strokeDasharray="2 4"
				/>
			))}
			<Path d={fillD} fill={`url(#${gradId})`} />
			<Path
				d={pathD}
				fill="none"
				stroke={stroke}
				strokeWidth={1.75}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			{pts.map(([x, y], i) => (
				<Circle
					key={`${x}-${y}`}
					cx={x}
					cy={y}
					r={i === pts.length - 1 ? 4 : 2}
					fill={p.bg}
					stroke={stroke}
					strokeWidth={1.5}
				/>
			))}
		</Svg>
	);
}
