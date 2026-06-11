"use client";

import { useEffect, useRef } from "react";

type Particle = {
	x: number;
	y: number;
	dx: number;
	dy: number;
	baseColor: string;
	opacity: number;
	r: number;
};

type RingDef = {
	radius: number;
	baseColor: string;
	opacity: number;
};

const PARTICLE_COLORS = [
	"rgba(245,200,66,",
	"rgba(62,207,191,",
	"rgba(123,97,255,",
	"rgba(240,240,245,",
];

const RINGS: RingDef[] = [
	{ radius: 260, baseColor: "rgba(245,200,66,", opacity: 0.12 },
	{ radius: 210, baseColor: "rgba(62,207,191,", opacity: 0.09 },
	{ radius: 160, baseColor: "rgba(123,97,255,", opacity: 0.1 },
	{ radius: 115, baseColor: "rgba(245,200,66,", opacity: 0.08 },
	{ radius: 72, baseColor: "rgba(62,207,191,", opacity: 0.09 },
	{ radius: 38, baseColor: "rgba(123,97,255,", opacity: 0.11 },
	{ radius: 16, baseColor: "rgba(245,200,66,", opacity: 0.13 },
];

const CARDINAL_ANGLES = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
const DIAG_ANGLES = [
	Math.PI / 4,
	(Math.PI * 3) / 4,
	(Math.PI * 5) / 4,
	(Math.PI * 7) / 4,
];

export function SignInBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener("resize", resize);

		const particles: Particle[] = Array.from({ length: 65 }, () => ({
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			dx: (Math.random() - 0.5) * 0.4,
			dy: (Math.random() - 0.5) * 0.4,
			baseColor:
				PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)] ??
				"rgba(240,240,245,",
			opacity: 0.12 + Math.random() * 0.35,
			r: 1.5 + Math.random() * 1.5,
		}));

		let frame = 0;
		let rafId = 0;

		const draw = () => {
			const w = canvas.width;
			const h = canvas.height;
			const cx = w / 2;
			const cy = h / 2;

			ctx.clearRect(0, 0, w, h);

			// Grid — vertical + horizontal lines
			ctx.setLineDash([]);
			ctx.strokeStyle = "rgba(255,255,255,0.04)";
			ctx.lineWidth = 0.5;
			for (let x = 0; x < w; x += 30) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, h);
				ctx.stroke();
			}
			for (let y = 0; y < h; y += 30) {
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(w, y);
				ctx.stroke();
			}

			// Diagonal lines (bottom-left → top-right, 45°)
			ctx.strokeStyle = "rgba(245,200,66,0.025)";
			ctx.lineWidth = 0.4;
			for (let i = -Math.ceil(h / 28) - 1; i <= Math.ceil(w / 28) + 1; i++) {
				const x0 = i * 28;
				ctx.beginPath();
				ctx.moveTo(x0, h);
				ctx.lineTo(x0 + h, 0);
				ctx.stroke();
			}

			// Concentric rings
			for (const [i, ring] of RINGS.entries()) {
				const isEven = i % 2 === 0;
				ctx.beginPath();
				ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
				ctx.strokeStyle = `${ring.baseColor}${ring.opacity})`;
				ctx.lineWidth = 0.8;
				ctx.setLineDash(isEven ? [3, 7] : [1, 5]);
				ctx.lineDashOffset = isEven ? -(frame * 0.3) : frame * 0.3;
				ctx.stroke();
			}
			ctx.setLineDash([]);

			// Cardinal lines (0°, 90°, 180°, 270°)
			ctx.strokeStyle = "rgba(245,200,66,0.10)";
			ctx.lineWidth = 0.6;
			for (const angle of CARDINAL_ANGLES) {
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.lineTo(cx + Math.cos(angle) * 270, cy + Math.sin(angle) * 270);
				ctx.stroke();
			}

			// Diagonal lines (45°, 135°, 225°, 315°)
			ctx.strokeStyle = "rgba(245,200,66,0.04)";
			ctx.lineWidth = 0.4;
			for (const angle of DIAG_ANGLES) {
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.lineTo(cx + Math.cos(angle) * 270, cy + Math.sin(angle) * 270);
				ctx.stroke();
			}

			// North needle (gold, pointing up)
			ctx.fillStyle = "rgba(245,200,66,1)";
			ctx.beginPath();
			ctx.moveTo(cx, cy - 55);
			ctx.lineTo(cx - 6, cy);
			ctx.lineTo(cx + 6, cy);
			ctx.closePath();
			ctx.fill();

			// South needle (teal, pointing down, 55% opacity)
			ctx.fillStyle = "rgba(62,207,191,0.55)";
			ctx.beginPath();
			ctx.moveTo(cx, cy + 55);
			ctx.lineTo(cx - 6, cy);
			ctx.lineTo(cx + 6, cy);
			ctx.closePath();
			ctx.fill();

			// Center dot — gold outer, dark inner
			ctx.beginPath();
			ctx.arc(cx, cy, 5, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(245,200,66,1)";
			ctx.fill();
			ctx.beginPath();
			ctx.arc(cx, cy, 2, 0, Math.PI * 2);
			ctx.fillStyle = "#05050E";
			ctx.fill();

			// Particles — move, bounce, draw
			for (const p of particles) {
				p.x += p.dx;
				p.y += p.dy;
				if (p.x < 0 || p.x > w) p.dx *= -1;
				if (p.y < 0 || p.y > h) p.dy *= -1;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = `${p.baseColor}${p.opacity})`;
				ctx.fill();
			}

			// Particle connections — hairlines between particles < 90px apart
			ctx.strokeStyle = "rgba(240,240,245,0.03)";
			ctx.lineWidth = 0.5;
			for (let i = 0; i < particles.length; i++) {
				const pa = particles[i];
				if (!pa) continue;
				for (let j = i + 1; j < particles.length; j++) {
					const pb = particles[j];
					if (!pb) continue;
					const dx = pa.x - pb.x;
					const dy = pa.y - pb.y;
					if (dx * dx + dy * dy < 8100) {
						ctx.beginPath();
						ctx.moveTo(pa.x, pa.y);
						ctx.lineTo(pb.x, pb.y);
						ctx.stroke();
					}
				}
			}

			frame++;
			rafId = requestAnimationFrame(draw);
		};

		rafId = requestAnimationFrame(draw);

		return () => {
			window.removeEventListener("resize", resize);
			cancelAnimationFrame(rafId);
		};
	}, []);

	return (
		<>
			{/* Animated canvas */}
			<canvas
				ref={canvasRef}
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 z-0 h-full w-full"
			/>

			{/* Radial light leaks */}
			<div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
				<div
					className="absolute top-0 left-0 h-[55%] w-[65%]"
					style={{
						background:
							"radial-gradient(ellipse at top left, rgba(245,200,66,0.18) 0%, transparent 70%)",
					}}
				/>
				<div
					className="absolute right-0 bottom-0 h-[50%] w-[55%]"
					style={{
						background:
							"radial-gradient(ellipse at bottom right, rgba(62,207,191,0.15) 0%, transparent 70%)",
					}}
				/>
				<div
					className="absolute top-0 right-0 h-[45%] w-[45%]"
					style={{
						background:
							"radial-gradient(ellipse at top right, rgba(123,97,255,0.12) 0%, transparent 70%)",
					}}
				/>
			</div>
		</>
	);
}
