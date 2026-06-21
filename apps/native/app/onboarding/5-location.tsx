// Q5 — country + remote/relocate prefs. Maps to profiles.country,
// open_to_remote, open_to_relocate.

import { getTokens, type Palette, type TypePairing } from "@north/tokens";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { CountryPicker } from "@/components/onboarding/CountryPicker";
import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[4];

export default function OnboardingLocationScreen() {
	const router = useRouter();
	const { p, t } = getTokens("warm", "humanist", "calm");
	const { answers, saveLocation } = useOnboardingState();
	const [saving, setSaving] = useState(false);

	const [remote, setRemote] = useState(answers.openToRemote);
	const [relocate, setRelocate] = useState(answers.openToRelocate);

	const canContinue = !!answers.country;

	async function handleNext() {
		if (!canContinue) return;
		setSaving(true);
		try {
			await saveLocation(answers.country ?? "", remote, relocate);
			router.push("/onboarding/6-time");
		} finally {
			setSaving(false);
		}
	}

	return (
		<QuestionShell
			index={4}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={!canContinue}
			nextLoading={saving}
			onNext={handleNext}
		>
			<View style={styles.wrap}>
				<CountryPicker
					value={answers.country}
					onChange={(country) => {
						void saveLocation(country, remote, relocate);
					}}
				/>

				<View style={styles.toggles}>
					<ToggleRow
						label="Open to remote opportunities"
						value={remote}
						onValueChange={(v) => {
							setRemote(v);
						}}
						p={p}
						t={t}
					/>
					<ToggleRow
						label="Open to relocating"
						value={relocate}
						onValueChange={(v) => {
							setRelocate(v);
						}}
						p={p}
						t={t}
					/>
				</View>
			</View>
		</QuestionShell>
	);
}

function ToggleRow({
	label,
	value,
	onValueChange,
	p,
	t,
}: {
	label: string;
	value: boolean;
	onValueChange: (v: boolean) => void;
	p: Palette;
	t: TypePairing;
}) {
	return (
		<View
			style={[
				styles.toggleRow,
				{ backgroundColor: p.surface, borderColor: p.lineHi },
			]}
		>
			<Text style={{ color: p.ink, fontFamily: t.ui, fontSize: 14, flex: 1 }}>
				{label}
			</Text>
			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{ false: p.lineHi, true: "#3ECFBF" }}
				thumbColor="#ffffff"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 16 },
	toggles: { gap: 10 },
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 14,
		borderWidth: 1,
	},
});
