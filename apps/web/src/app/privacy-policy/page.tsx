// Public privacy policy — required by both the App Store and Play Console at
// submission, and named in docs/privacy-dpa-compliance.md as the disclosure
// users are pointed to. This is a working draft assembled from that
// compliance doc; it still needs a licensed-solicitor review (see that doc's
// action item #5) and a confirmed legal entity name + contact email before
// it's final. Treat the [bracketed] placeholders as required TODOs.

const LAST_UPDATED = "July 2026";

export const metadata = {
	title: "Privacy Policy — North",
};

export default function PrivacyPolicyPage() {
	return (
		<div className="min-h-screen bg-[#EDF1F8] px-5 py-12 text-[#0E1420] sm:px-8">
			<div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 sm:p-12">
				<h1 className="mb-1 font-bold text-3xl">Privacy Policy</h1>
				<p className="mb-8 text-[#0E1420]/60 text-sm">
					Last updated: {LAST_UPDATED}
				</p>

				<Section title="Who we are">
					<p>
						North ("North", "we", "us") is a mobile and web app that helps
						people convert inspiration into consistent, aligned action. This
						policy explains what we collect, why, and the choices you have about
						it — including how to delete your account.
					</p>
					<p>
						Data controller: [North's registered legal entity name — confirm
						before submission]. Contact:{" "}
						<a href="mailto:privacy@trynorth.app" className="underline">
							privacy@trynorth.app
						</a>{" "}
						[confirm this inbox is live and monitored before submission].
					</p>
				</Section>

				<Section title="What we collect">
					<p>
						Account and profile data you provide directly: your name, email,
						focus areas, career interests, location, and the answers you give
						during onboarding.
					</p>
					<p>
						Behavioral data from how you use the app — every interaction with
						the For You feed (view, save, "matters", skip, share, finish, and
						time spent) is logged, along with journal entries, mission
						completion, and weekly check-ins. This is what powers your Signal
						score and personalized recommendations; North's core feature doesn't
						work without it.
					</p>
					<p>
						Device and diagnostic data: crash logs and basic device information
						(OS version, app version) via our analytics processor.
					</p>
				</Section>

				<Section title="Why we collect it">
					<p>
						To provide the core features you signed up for: your Signal score,
						personalized For You feed and Opportunities ranking, mission
						tracking, and journal-based reflections.
					</p>
					<p>
						To maintain and improve the app, including diagnosing crashes and
						understanding aggregate usage patterns.
					</p>
					<p>
						We do not sell your data, and we do not use it for third-party
						advertising.
					</p>
				</Section>

				<Section title="Who we share it with">
					<p>
						<strong>PostHog, Inc.</strong> — our analytics processor. PostHog
						receives the same behavioral events described above, tagged to your
						account ID (not your name or email), and processes them under its
						own privacy policy and a data processing agreement with North.{" "}
						<a
							href="https://posthog.com/privacy"
							className="underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							PostHog's privacy policy
						</a>
						.
					</p>
					<p>
						<strong>Anthropic</strong> — the AI provider behind your Signal
						coaching summaries and journal analysis. Your journal entries and
						relevant context are sent to generate these summaries; Anthropic
						does not use this data to train its models under our agreement with
						them.
					</p>
					<p>
						<strong>Supabase</strong> — our database and authentication
						infrastructure provider, which stores all the data described above.
					</p>
					<p>
						<strong>Polar</strong> — if you subscribe to North Premium, Polar
						processes your payment. We do not receive or store your card
						details.
					</p>
					<p>
						We do not otherwise share your personal data with third parties, and
						we never sell it.
					</p>
				</Section>

				<Section title="How long we keep it">
					<p>
						Behavioral event data (feed interactions, journal entries) is
						retained for up to 12 months from creation, or until you delete your
						account, whichever comes first. Account and profile data is kept for
						as long as your account is active.
					</p>
				</Section>

				<Section title="Your rights">
					<p>
						<strong>Delete your account.</strong> You can permanently delete
						your account and all associated data at any time from Profile →
						Delete account, in both the app and on the web. This is irreversible
						and takes effect immediately.
					</p>
					<p>
						<strong>Access or export your data.</strong> Email{" "}
						<a href="mailto:privacy@trynorth.app" className="underline">
							privacy@trynorth.app
						</a>{" "}
						and we'll provide a copy of your data within a reasonable time.
					</p>
					<p>
						<strong>Withdraw consent.</strong> Deleting your account withdraws
						consent for all behavioral data processing described in this policy.
					</p>
				</Section>

				<Section title="Data protection notice — Jamaica">
					<p>
						For users in Jamaica, this processing is carried out under the Data
						Protection Act, 2020, on the basis of your informed consent, given
						during onboarding. See the sections above for what's collected, why,
						and how to withdraw that consent by deleting your account.
					</p>
				</Section>

				<Section title="Security">
					<p>
						Your data is encrypted in transit. Access to behavioral data is
						restricted by row-level security so only you (and our automated
						systems acting on your behalf) can read your own records.
					</p>
				</Section>

				<Section title="Changes to this policy">
					<p>
						If we make material changes to this policy, we'll update the date
						above and, where required, notify you in the app.
					</p>
				</Section>

				<Section title="Contact">
					<p>
						Questions about this policy or your data? Email{" "}
						<a href="mailto:privacy@trynorth.app" className="underline">
							privacy@trynorth.app
						</a>
						.
					</p>
				</Section>
			</div>
		</div>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mb-7">
			<h2 className="mb-2 font-semibold text-lg">{title}</h2>
			<div className="space-y-2 text-[#0E1420]/80 text-sm leading-relaxed">
				{children}
			</div>
		</section>
	);
}
