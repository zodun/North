"use client";

import { useState } from "react";
import { MISSIONS, type MissionTask } from "../_lib/data";
import {
	easings,
	type Palette,
	type Tweaks,
	type TypePairing,
} from "../_lib/tokens";
import { Icon } from "./icon";

function TaskRing({
	done,
	p,
	size = 24,
}: {
	done: boolean;
	p: Palette;
	size?: number;
}) {
	const r = size / 2 - 1.5;
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				fill="none"
				stroke={done ? p.accent : p.lineHi}
				strokeWidth={1.5}
			/>
			{done && (
				<>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={r - 4}
						fill={p.accent}
						opacity={0.18}
					/>
					<path
						d={`M${size * 0.3} ${size / 2}l${size * 0.13} ${size * 0.13}L${size * 0.72} ${size * 0.35}`}
						stroke={p.accent}
						strokeWidth={1.8}
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</>
			)}
		</svg>
	);
}

function MissionHeader({
	mission,
	p,
	t,
}: {
	mission: typeof MISSIONS.today;
	p: Palette;
	t: TypePairing;
}) {
	return (
		<div style={{ padding: "0 24px", marginBottom: 18 }}>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: p.inkDim,
					fontWeight: 500,
					marginBottom: 12,
				}}
			>
				{mission.date} · Today
			</div>
			<h1
				style={{
					fontFamily: t.display,
					fontWeight: t.displayWeight,
					letterSpacing: t.displayTracking,
					fontStyle: t.editorialItalic ? "italic" : "normal",
					fontSize: 30,
					lineHeight: 1.22,
					color: p.ink,
					margin: "0 0 10px 0",
				}}
			>
				{mission.title}
			</h1>
			<p
				style={{
					fontFamily: t.ui,
					fontSize: 14.5,
					lineHeight: 1.5,
					color: p.inkMid,
					margin: 0,
					textWrap: "pretty",
				}}
			>
				{mission.intent}
			</p>
		</div>
	);
}

function DonePanel({ p, t }: { p: Palette; t: TypePairing }) {
	return (
		<div
			style={{
				margin: "28px 24px 0 24px",
				padding: "24px",
				borderRadius: 22,
				background: p.accentSoft,
				border: `1px solid ${p.accent}55`,
			}}
		>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: p.accent,
					fontWeight: 600,
					marginBottom: 10,
				}}
			>
				Rhythm intact
			</div>
			<div
				style={{
					fontFamily: t.display,
					fontWeight: t.displayWeight,
					letterSpacing: t.displayTracking,
					fontStyle: t.editorialItalic ? "italic" : "normal",
					fontSize: 22,
					lineHeight: 1.28,
					color: p.ink,
				}}
			>
				You did the three things you said you would.
			</div>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 13.5,
					color: p.inkMid,
					marginTop: 8,
				}}
			>
				Tomorrow's mission opens at 5am local.
			</div>
		</div>
	);
}

function YesterdayCard({ p, t }: { p: Palette; t: TypePairing }) {
	return (
		<div
			style={{
				margin: "32px 24px 0 24px",
				padding: "18px 18px",
				borderRadius: 18,
				background: "transparent",
				border: `1px solid ${p.line}`,
			}}
		>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: p.inkDim,
					fontWeight: 500,
					marginBottom: 8,
				}}
			>
				Yesterday
			</div>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 13.5,
					color: p.inkMid,
					lineHeight: 1.5,
				}}
			>
				{MISSIONS.yesterday.summary}
			</div>
		</div>
	);
}

function ChecklistView({
	mission,
	p,
	t,
	tasks,
	toggleTask,
	allDone,
}: {
	mission: typeof MISSIONS.today;
	p: Palette;
	t: TypePairing;
	tasks: MissionTask[];
	toggleTask: (id: string) => void;
	allDone: boolean;
}) {
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			<MissionHeader mission={mission} p={p} t={t} />
			<div
				style={{
					padding: "0 16px",
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				{tasks.map((task, i) => (
					<button
						type="button"
						key={task.id}
						onClick={() => toggleTask(task.id)}
						style={{
							display: "flex",
							alignItems: "flex-start",
							gap: 14,
							padding: "16px 16px",
							background: p.surface,
							border: `1px solid ${p.line}`,
							borderRadius: 18,
							textAlign: "left",
							cursor: "pointer",
							transition: `all 200ms ${easings.calm}`,
						}}
					>
						<div style={{ paddingTop: 1 }}>
							<TaskRing done={task.done} p={p} size={24} />
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontFamily: t.ui,
									fontSize: 15,
									lineHeight: 1.4,
									fontWeight: 500,
									color: task.done ? p.inkDim : p.ink,
									textDecoration: task.done ? "line-through" : "none",
									textDecorationColor: p.inkDim,
								}}
							>
								{task.label}
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									marginTop: 8,
								}}
							>
								<span
									style={{
										fontFamily: t.mono,
										fontSize: 10.5,
										color: p.inkDim,
										letterSpacing: "0.04em",
									}}
								>
									{task.est}
								</span>
								<span
									style={{
										width: 3,
										height: 3,
										borderRadius: 1.5,
										background: p.inkDim,
									}}
								/>
								<span
									style={{
										fontFamily: t.ui,
										fontSize: 10.5,
										color: p.inkDim,
										textTransform: "uppercase",
										letterSpacing: "0.1em",
									}}
								>
									{task.kind}
								</span>
							</div>
						</div>
						<div
							style={{
								fontFamily: t.mono,
								fontSize: 11,
								color: p.inkDim,
								alignSelf: "flex-start",
								paddingTop: 2,
							}}
						>
							0{i + 1}
						</div>
					</button>
				))}
			</div>
			{allDone ? <DonePanel p={p} t={t} /> : <YesterdayCard p={p} t={t} />}
		</div>
	);
}

function RitualView({
	mission,
	p,
	t,
	tasks,
	toggleTask,
	allDone,
}: {
	mission: typeof MISSIONS.today;
	p: Palette;
	t: TypePairing;
	tasks: MissionTask[];
	toggleTask: (id: string) => void;
	allDone: boolean;
}) {
	const labels = ["Open", "Deepen", "Close"];
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			<MissionHeader mission={mission} p={p} t={t} />
			<div style={{ padding: "0 24px", position: "relative" }}>
				<div
					style={{
						position: "absolute",
						left: 35,
						top: 22,
						bottom: 22,
						width: 1,
						background: p.line,
					}}
				/>
				{tasks.map((task, i) => (
					<div
						key={task.id}
						style={{
							display: "flex",
							gap: 16,
							marginBottom: 22,
							position: "relative",
						}}
					>
						<button
							type="button"
							onClick={() => toggleTask(task.id)}
							style={{
								position: "relative",
								zIndex: 1,
								marginTop: 4,
								width: 40,
								height: 40,
								borderRadius: 20,
								background: task.done ? p.accentSoft : p.surface,
								border: `1px solid ${task.done ? p.accent : p.lineHi}`,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								padding: 0,
								transition: `all 250ms ${easings.calm}`,
							}}
						>
							{task.done ? (
								<Icon
									name="check"
									size={18}
									stroke={p.accent}
									strokeWidth={2}
								/>
							) : (
								<span
									style={{ fontFamily: t.mono, fontSize: 13, color: p.inkMid }}
								>
									{i + 1}
								</span>
							)}
						</button>
						<div style={{ flex: 1, paddingTop: 2 }}>
							<div
								style={{
									fontFamily: t.ui,
									fontSize: 10.5,
									letterSpacing: "0.18em",
									textTransform: "uppercase",
									color: task.done ? p.accent : p.inkDim,
									fontWeight: 500,
									marginBottom: 6,
								}}
							>
								{labels[i]} · {task.est}
							</div>
							<div
								style={{
									fontFamily: t.display,
									fontWeight: t.displayWeight,
									letterSpacing: t.displayTracking,
									fontStyle: t.editorialItalic ? "italic" : "normal",
									fontSize: 20,
									lineHeight: 1.25,
									color: task.done ? p.inkMid : p.ink,
								}}
							>
								{task.label}
							</div>
						</div>
					</div>
				))}
			</div>
			{allDone ? <DonePanel p={p} t={t} /> : <YesterdayCard p={p} t={t} />}
		</div>
	);
}

function SingleFocusView({
	mission,
	p,
	t,
	tasks,
	toggleTask,
	allDone,
}: {
	mission: typeof MISSIONS.today;
	p: Palette;
	t: TypePairing;
	tasks: MissionTask[];
	toggleTask: (id: string) => void;
	allDone: boolean;
}) {
	const nextIdx = tasks.findIndex((x) => !x.done);
	const idx = nextIdx === -1 ? tasks.length - 1 : nextIdx;
	const current = tasks[idx];
	if (!current) return null;
	const remaining = tasks.length - tasks.filter((x) => x.done).length;
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				padding: "88px 24px 130px 24px",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: p.inkDim,
					fontWeight: 500,
					marginBottom: 10,
				}}
			>
				{mission.date}
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 6,
					marginBottom: 28,
				}}
			>
				{tasks.map((task) => (
					<div
						key={task.id}
						style={{
							flex: 1,
							height: 3,
							borderRadius: 2,
							background: task.done ? p.accent : p.line,
							transition: `background 250ms ${easings.calm}`,
						}}
					/>
				))}
			</div>

			{allDone ? (
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "flex-start",
						gap: 20,
					}}
				>
					<div
						style={{
							fontFamily: t.ui,
							fontSize: 11,
							letterSpacing: "0.18em",
							textTransform: "uppercase",
							color: p.accent,
							fontWeight: 600,
						}}
					>
						Rhythm intact
					</div>
					<h1
						style={{
							fontFamily: t.display,
							fontWeight: t.displayWeight,
							letterSpacing: t.displayTracking,
							fontStyle: t.editorialItalic ? "italic" : "normal",
							fontSize: 36,
							lineHeight: 1.28,
							color: p.ink,
							margin: 0,
						}}
					>
						You did the three things you said you would.
					</h1>
					<p
						style={{
							fontFamily: t.ui,
							fontSize: 14.5,
							lineHeight: 1.5,
							color: p.inkMid,
							margin: 0,
						}}
					>
						Nothing more is asked of today. Tomorrow's mission opens at 5am
						local.
					</p>
				</div>
			) : (
				<>
					<div
						style={{
							fontFamily: t.ui,
							fontSize: 11,
							letterSpacing: "0.18em",
							textTransform: "uppercase",
							color: p.inkDim,
							fontWeight: 500,
							marginBottom: 14,
						}}
					>
						{remaining === 1 ? "Last thing" : `${remaining} things left`} ·{" "}
						{current.est}
					</div>
					<h1
						style={{
							fontFamily: t.display,
							fontWeight: t.displayWeight,
							letterSpacing: t.displayTracking,
							fontStyle: t.editorialItalic ? "italic" : "normal",
							fontSize: 34,
							lineHeight: 1.28,
							color: p.ink,
							margin: "0 0 16px 0",
						}}
					>
						{current.label}
					</h1>
					<p
						style={{
							fontFamily: t.ui,
							fontSize: 14.5,
							lineHeight: 1.55,
							color: p.inkMid,
							margin: 0,
						}}
					>
						{mission.intent}
					</p>
					<div style={{ flex: 1 }} />
					<button
						type="button"
						onClick={() => toggleTask(current.id)}
						style={{
							width: "100%",
							padding: "18px",
							borderRadius: 18,
							background: p.accent,
							color: p.accentInk,
							border: "none",
							fontFamily: t.ui,
							fontSize: 15,
							fontWeight: 600,
							letterSpacing: "-0.005em",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
						}}
					>
						<Icon name="check" size={18} stroke={p.accentInk} strokeWidth={2} />
						Mark this done
					</button>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginTop: 14,
						}}
					>
						<button
							type="button"
							style={{
								background: "transparent",
								border: "none",
								color: p.inkDim,
								fontFamily: t.ui,
								fontSize: 12.5,
								cursor: "pointer",
								padding: 4,
							}}
						>
							Move to later
						</button>
						<button
							type="button"
							style={{
								background: "transparent",
								border: "none",
								color: p.inkDim,
								fontFamily: t.ui,
								fontSize: 12.5,
								cursor: "pointer",
								padding: 4,
							}}
						>
							Why this task?
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export function Mission({
	p,
	t,
	tweaks,
}: {
	p: Palette;
	t: TypePairing;
	tweaks: Tweaks;
}) {
	const [tasks, setTasks] = useState<MissionTask[]>(MISSIONS.today.tasks);
	const toggleTask = (id: string) =>
		setTasks((xs) =>
			xs.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
		);
	const allDone = tasks.every((x) => x.done);
	const mission = MISSIONS.today;
	const style = tweaks.missionStyle || "checklist";
	if (style === "ritual")
		return (
			<RitualView
				mission={mission}
				p={p}
				t={t}
				tasks={tasks}
				toggleTask={toggleTask}
				allDone={allDone}
			/>
		);
	if (style === "single")
		return (
			<SingleFocusView
				mission={mission}
				p={p}
				t={t}
				tasks={tasks}
				toggleTask={toggleTask}
				allDone={allDone}
			/>
		);
	return (
		<ChecklistView
			mission={mission}
			p={p}
			t={t}
			tasks={tasks}
			toggleTask={toggleTask}
			allDone={allDone}
		/>
	);
}
