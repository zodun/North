# PRIV-02 — Jamaica Data Protection Act 2020: Behavioural Capture Compliance

**Scope:** This note covers the behavioural data collected by North's Signal capture layer (SIGCAP-01–03) and documents how that processing satisfies the Jamaica Data Protection Act 2020 (DPA 2020) for the closed beta.

---

## 1. What is collected

Every authenticated user interaction with the For You feed is logged to `content_interactions`:

| Field | Description |
|---|---|
| `action` | One of: `view`, `save`, `matters` (like), `pass` (skip), `finish`, `share`, `long_dwell` |
| `dwell_ms` | Time spent on an item in milliseconds |
| `content_category_id` | Content category at time of interaction |
| `kind` | Content type (`essay`, `voice`, `story`, `opportunity`) |
| `created_at` | Timestamp of the event |

This data is mirrored to PostHog (analytics processor) as a `content_interaction` event with the same properties.

---

## 2. Lawful basis — DPA 2020 s.11(c)

**Basis: Informed consent.**

Consent is obtained on the final screen of onboarding (screen 7 of 7) before the user can access any part of the app that performs behavioural capture. The user must tap "I agree — take me in" to proceed. Pressing this button calls the `complete_onboarding` RPC, which atomically sets `profiles.consent_given_at` and `profiles.onboarded_at`.

**Consent meets the DPA 2020 standard because it is:**

- **Freely given** — refusing consent means not using the app; there is no lesser tier of access. This is acceptable because the consent is for the core feature (Signal score), not a peripheral use.
- **Specific** — the consent screen names the exact events captured (view, dwell, save, skip, share) and the purpose (Signal score, feed and mission personalisation).
- **Informed** — the disclosure enumerates: what is collected, why, the third-party processor (PostHog), the retention period (12 months), and the withdrawal mechanism (account deletion).
- **Unambiguous** — consent requires an affirmative tap; the flow cannot be completed passively.

---

## 3. Data controller and processor

| Role | Party | Contact |
|---|---|---|
| Data controller | North | [TBD — confirm legal entity name and contact email before beta launch] |
| Data processor | PostHog, Inc. | https://posthog.com/privacy — DPA available on request |

PostHog is used for analytics aggregation only. It receives the same event fields listed in §1 plus a `distinct_id` (the Supabase user UUID, not PII). PostHog processes under its own DPA; North must execute a Data Processing Agreement with PostHog before beta if not already in place.

**Action item:** Execute PostHog DPA before beta launch.

---

## 4. Data subject rights — DPA 2020 s.17–22

| Right | Current implementation |
|---|---|
| **Access** | `content_interactions` rows are readable by the authenticated user via RLS (`select` policy). Not yet surfaced in the Profile UI — SEC-03 / KPI deferred. |
| **Rectification** | Not applicable — behavioural logs are factual records of what occurred. |
| **Erasure** | Account deletion cascades to `content_interactions` via `ON DELETE CASCADE` on `auth.users`. Profile UI "wipe" path is in SEC-03 (not yet built). |
| **Portability** | Export path is in SEC-03 (not yet built). |
| **Withdraw consent** | User deletes their account, which triggers cascade deletion of all behavioural data. This is stated explicitly in the consent disclosure and in `CONSENT_DISCLOSURE` in `questions.ts`. |

**Action items before beta:**
- Complete SEC-03 (data export + delete UI in Profile).
- Add a "Download my data" and "Delete my account" entry point in the Profile tab.

---

## 5. Retention

Behavioural events are retained for **up to 12 months** from creation, or until account deletion — whichever comes first. The 12-month figure is stated in `CONSENT_DISCLOSURE` in the app.

A scheduled Supabase job to purge events older than 12 months is not yet implemented and should be added before or shortly after beta launch.

**Action item:** Add a scheduled SQL job (`DELETE FROM content_interactions WHERE created_at < now() - interval '12 months'`) to run weekly.

---

## 6. Security — DPA 2020 s.27

- **Row-Level Security**: `content_interactions` uses append-only RLS (migration `0017_signal_cap_context.sql`) — users can insert and select their own rows but cannot update or delete. The service role (used only in Edge Functions) bypasses RLS by design.
- **No client-side secrets**: PostHog key is bundled in the app as `EXPO_PUBLIC_POSTHOG_KEY` (public by design — PostHog client keys are not secret). No server credentials are exposed to the client.
- **Encryption in transit**: Supabase and PostHog both enforce TLS.

---

## 7. Open items before beta

| # | Item | Owner |
|---|---|---|
| 1 | Confirm legal entity name and controller contact email | Jordayne |
| 2 | Execute PostHog Data Processing Agreement | Jordayne |
| 3 | Build SEC-03: export + delete UI in Profile | Dev |
| 4 | Add weekly purge job for events > 12 months | Dev |
| 5 | Review consent wording with a Jamaica-licensed solicitor | Jordayne |

---

*This document is a developer compliance check, not a legal opinion. Consult a qualified Jamaican data protection practitioner before the beta cohort exceeds 50 users.*
