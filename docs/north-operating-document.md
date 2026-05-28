**NORTH**

Operating Document

*Optimising for direction, not attention.*

Project Owner: Jordayne Price

Version 0.1 (Draft)

Last Updated: 28 May 2026

Table of Contents

Document Metadata

| **Field** | **Value** |
|----|----|
| Project Name | North |
| Project Owner (Accountable) | Jordayne Price |
| Team / Squad | **\[TBD — confirm squad; see Section 9\]** |
| Start Date | **\[TBD\]** |
| Target End Date | **\[TBD — recommend setting against the 3-milestone plan in Section 10\]** |
| Current Status | Not Started |
| Last Updated | 28 May 2026 |
| Version | 0.1 (Draft) |
| Document Owner | Jordayne Price |

**One-line summary:** *North is a mobile app that helps young people — starting in the Caribbean — convert inspiration into consistent, aligned action by pairing an intentional discovery feed with a daily mission loop and behavioural “signal” analytics.*

1\. Project Summary

**Purpose:** *High-level overview of what the project is, who it serves, and the change it creates.*

North is a mobile application that helps people move through life with clarity. The world’s most successful consumer apps are engineered to capture attention; North is built to give users direction instead. It does this through five tabs working as one loop: an intentional discovery feed (For You) that surfaces purpose-, career-, and growth-oriented content; a daily Mission system that turns that inspiration into small, completed actions; a Signal layer that reflects a user’s real behaviour back to them — what energises them, what they avoid, where their time goes; an Opportunities feed that converts clarity into concrete life movement (jobs, internships, scholarships, accelerators, grants); and a Profile that visualises identity evolution over time so the user can feel themselves changing.

The MVP is deliberately narrow. It is not the investor pitch or the eventual platform — it is the smallest product that can prove a single claim: people consistently feel more aligned after using North. To prove that, the first version manually curates content and opportunities rather than building automated recommendation or scraping pipelines, and ships only the AI features that are essential to the core loop. The target users are young people in the Caribbean (with Jamaica as the launch market) who feel directionless and want a calmer, more intentional alternative to attention-optimised social feeds. Success is measured not by time-in-app but by sustained mission completion and a measurable lift in self-reported alignment.

2\. Concept Note

2.1 Background & Purpose

Consumer technology has optimised relentlessly for one metric: attention. Feeds, autoplay, and infinite scroll are tuned to maximise time-on-device, and they do so extraordinarily well. The byproduct is a generation that consumes enormous volumes of aspirational content yet often feels less directed, not more. North exists to invert that objective. Its purpose is to optimise for direction — to help a person understand what genuinely gives them energy and momentum, and then to translate that understanding into repeated, completed action.

2.2 Background \| Origin

North originates from a specific gap observed among young people, particularly in the Caribbean: an abundance of motivation and inspiration, paired with a scarcity of structured, low-friction ways to act on it. Motivational content, productivity tools, and journaling apps each address a fragment of the problem, but none close the loop from “I feel inspired” to “I consistently took aligned action and can see myself changing.” The triggering insight is that the same mechanics that make attention apps addictive — a personalised feed, streaks, progress visualisation — can be repointed at direction instead of consumption.

2.3 Problem / Opportunity

Concretely, the current state is broken in three ways. First, inspiration evaporates: a user watches a compelling clip about building a remote career and does nothing with it within the hour. Second, people lack honest awareness of their own behaviour — they cannot see that they have avoided the same kind of task four times, or that they engage most with entrepreneurship content while ignoring the steps it implies. Third, even motivated users struggle to find legitimate, relevant opportunities (internships, scholarships, grants, accelerators) surfaced at the moment their intent is highest. The opportunity is to own the path from inspiration → action → self-awareness → real-world movement in a single, calm product.

2.4 Why Now

The cost of delay is competitive and behavioural. The mechanics North relies on (personalised feeds, on-device behavioural signals, lightweight LLM classification and summarisation) are now cheap and accessible to a small team via Supabase and the OpenAI API, which was not true a few years ago. At the same time, dissatisfaction with attention-optimised feeds is rising, creating an opening for an intentional alternative. Caribbean youth in particular are underserved by global products that surface few locally relevant opportunities or success stories. Building now, while curation can still be done by hand and the moat (behavioural signal data) can begin accumulating, is materially cheaper than entering later against an incumbent that already holds users’ direction data.

2.5 Primary Users / Customers / Stakeholders

North serves several audiences, each with a distinct benefit:

- **End users (primary):** young people, initially in Jamaica and the wider Caribbean, who feel directionless and want a calmer, intentional alternative to attention-driven feeds. Benefit: they convert inspiration into consistent action and can see their own growth.

- **Founder / project owner:** validates the core thesis with the smallest possible build and begins accumulating proprietary behavioural-signal data — the long-term moat.

- **Opportunity providers (later):** organisations posting jobs, scholarships, grants, and programmes gain access to a motivated, intent-rich audience.

- **Caribbean ecosystem / future partners:** a product that highlights Caribbean success stories and locally relevant opportunities strengthens regional talent development.

2.6 What Success Changes

In the post-success world, a North user opens the app and is met with a calm, cinematic feed rather than a hyperstimulating one. They scroll a few intentional pieces of content, then complete a daily mission made of three small tasks — apply to one internship, message one person, spend thirty minutes learning. Over weeks, their streak grows and their Profile visibly evolves. When they open the Signal tab, North reflects honest patterns back to them: what energises them, what they keep avoiding, where their time actually goes. When their intent is high, the Opportunities tab puts a relevant, verified opportunity in front of them. The defining outcome is subjective but measurable: the user reports feeling more aligned and directed than before they started using North.

3\. Outcome & Goals

**Purpose:** *Defines what success looks like in measurable terms.*

3.1 Outcome Statement

By the end of the MVP build (target date \[TBD\]), North is a live React Native closed beta in which a defined cohort of onboarded users completes a daily mission across a sustained streak and reports a measurable lift in self-assessed life alignment from onboarding to week 4.

3.2 Project Goals (Max 3)

1.  **Ship the 5-tab MVP to a closed beta that proves the retention loop.** Deliver onboarding, the For You feed, the Mission system, Profile + streaks, Signal analytics, and a manually curated Opportunities feed to a real user cohort.

2.  **Validate the core thesis — users feel more aligned after using North.** Demonstrate a statistically meaningful lift in self-reported alignment between onboarding and week 4 for active users.

3.  **Begin building the Signal moat.** Reliably capture per-user behavioural signal data (consume / ignore / complete / avoid) and ship a first signal-vs-noise classification users find accurate.

3.3 Success Measures / KPIs

*Targets confirmed 28 May 2026 (see DEC-11). The alignment-lift number is committed **with the metrics-spec demand-bias controls in force** (triangulation against behavioural data, measure-the-churned, and continued willingness to re-tune after cohort 1) — a +1.0pt move that is not corroborated by signal-score and mission-completion movement is treated as demand bias, not as a hit.*

| **Metric** | **Baseline** | **Target** | **By When** | **Data Source** |
|----|----|----|----|----|
| Onboarding completion rate | N/A (pre-launch) | **≥85%** | end of M1 | PostHog funnel |
| Daily mission completion rate (active users) | N/A | **≥40%** | end of M2 | Supabase (user_mission_tasks) |
| 7-day streak rate | N/A | **≥25%** | end of M2 | Supabase (streaks) |
| D7 retention | N/A | **≥30%** | end of M2 | PostHog cohort |
| Self-reported alignment lift (onboarding → wk4) | N/A | **+1.0 pt on 5-pt scale** | end of M3 | In-app survey (MLQ presence-of-meaning per DEC-09) |
| Signal classification accuracy (user-rated) | N/A | **≥75% "feels accurate"** | end of M3 | In-app thumbs rating |

4\. Rationale

**Purpose:** *Shows the chain of impact from this project to the main organizational objective.*

**Which organizational objective does this project support? \[TBD — North appears to be a founder-led venture rather than an Intellibus initiative; confirm whether the laddering objective is a personal venture thesis or a company OKR.\]**

How this project connects to the objective (proposed chain of impact):

1.  North ships an MVP that proves a single, falsifiable claim — that users feel more aligned after use — at minimal build cost.

2.  A validated alignment loop plus accumulating behavioural-signal data creates a defensible, proprietary asset (the Signal moat) that attention-optimised competitors do not have.

3.  That asset underwrites the longer-term objective: a direction-optimised platform serving Caribbean (and eventually global) youth, monetisable via opportunity placement and premium features.

**Notes (if unclear):** *The laddering objective is the main open item in this section. Confirm the parent objective so the chain of impact can be made explicit.*

5\. Scope

**Purpose:** *Prevents scope creep and clarifies guardrails.*

5.1 In Scope

- Onboarding flow (7 questions) that generates a starter mission, an initial content feed, and a growth path.

- For You tab: vertical scroll feed with like / save / share, topic following, and content categories — powered by 50–100 manually curated pieces of content.

- Mission tab: one daily mission with three tasks, task checklist, streak system, completion tracking, and a progress bar.

- Signal tab: signal score, weekly behavioural analysis, time breakdown, completion analytics, and avoidance/engagement callouts.

- Opportunities tab: searchable feed with filters and save/apply, populated by manually uploaded opportunities, plus a submit-opportunity intake.

- Profile tab: streaks, completed missions, signal score, saved opportunities, goals, focus areas, and growth stats.

- The five essential AI features only: content recommendation, signal-vs-noise classification, mission generation, behaviour summaries, and reflection analysis.

- Auth, behavioural event capture, and analytics instrumentation needed for the loop and the KPIs.

5.2 Out of Scope

- Automated content-recommendation engine at launch — content is manually curated for the first version.

- Scraping or automated ingestion of opportunities — opportunities are manually uploaded for the first version.

- Opportunity verification system (deferred; manual trust only at launch).

- Payments / monetisation (Stripe) — explicitly later.

- Web app or desktop client — mobile (React Native + Expo) only.

- Public / open launch and marketing scale-up — MVP targets a closed beta cohort.

- Social graph features beyond following topics (e.g., friends, DMs, comments).

- Creator/publisher tooling and any creator-programme functionality beyond listing them as opportunities.

5.3 Not Now (Future Consideration)

- AI-driven personalised content recommendations once curated behaviour data exists.

- Automated opportunity ingestion and a verification/trust system.

- Monetisation: premium tier, opportunity-provider placements (Stripe).

- Expansion beyond Jamaica to the wider Caribbean and global markets.

- Richer social and community features.

6\. Requirements

**Purpose:** *Captures the functional and non-functional requirements that define what is being built.*

6.1 Functional Requirements

Onboarding (ONB)

- FR-ONB-01: The app shall present a 7-question onboarding flow covering: what feels missing, desired future, inspiring content, what to improve, career interests, biggest distraction, and what the user wants freedom from.

- FR-ONB-02: On completion, the app shall generate a starter mission, an initial content feed, and a growth path derived from the answers.

- FR-ONB-03: Onboarding responses shall persist to the user record and be re-usable by mission generation and content recommendation.

- FR-ONB-04: The user shall be able to complete onboarding in a single uninterrupted session and resume if interrupted.

For You Feed (FEED)

- FR-FEED-01: The app shall present a vertical scroll feed of short videos, posts, opportunities, missions, founder stories, and career paths.

- FR-FEED-02: Each content item shall support like, save, and share actions.

- FR-FEED-03: The user shall be able to follow topics and filter by content category (Purpose, Careers, Entrepreneurship, Remote work, AI, Caribbean success, Self development, Opportunities, Productivity, Mental clarity).

- FR-FEED-04: The first version shall serve from 50–100 manually curated content items; automated recommendation is explicitly deferred.

- FR-FEED-05: The feed shall emit behavioural events (view, dwell time, like, save, share, skip) to the signal capture layer.

Mission System (MSN)

- FR-MSN-01: Each user shall receive one daily mission composed of three signal tasks.

- FR-MSN-02: Missions shall be generated from the user’s onboarding answers and focus areas (AI mission generation).

- FR-MSN-03: The mission card shall present a task checklist with per-task completion toggles and an overall progress bar.

- FR-MSN-04: The app shall maintain a streak that increments on days when the daily mission is completed and resets per defined rules.

- FR-MSN-05: Completion and avoidance of missions/tasks shall be recorded and emitted to the signal capture layer.

Signal (SIG)

- FR-SIG-01: The app shall compute and display a per-user signal score.

- FR-SIG-02: The app shall produce a weekly behavioural analysis covering what the user consumes, ignores, completes, and avoids.

- FR-SIG-03: The app shall present a time breakdown and completion analytics.

- FR-SIG-04: The app shall surface natural-language callouts (e.g., “You avoided this mission 4 times,” “You engage most with startup content”) classified as Signal (aligned) or Noise (energy-wasting).

- FR-SIG-05: Users shall be able to rate whether a Signal/Noise classification feels accurate (feedback for the KPI and model tuning).

Opportunities (OPP)

- FR-OPP-01: The app shall present a searchable feed of opportunities: jobs, internships, scholarships, accelerators, grants, communities, events, and creator programmes.

- FR-OPP-02: The feed shall support filters and a save/apply action per opportunity.

- FR-OPP-03: Opportunities shall be manually uploaded by an administrator in the first version; scraping is deferred.

- FR-OPP-04: The app shall provide a submit-opportunity intake for user-suggested opportunities.

- FR-OPP-05: A verification/trust system is deferred to a later phase.

Profile (PRO)

- FR-PRO-01: The Profile tab shall display streaks, completed missions, signal score, saved opportunities, goals, focus areas, and growth stats.

- FR-PRO-02: Profile content shall update as the user completes missions and accrues behavioural data so identity evolution is visible over time.

AI Services (AI)

- FR-AI-01: Content recommendation (post-MVP gating; manual curation first) shall rank curated content by inferred energy/direction fit.

- FR-AI-02: Signal-vs-noise classification shall label behaviours as aligned or energy-wasting using the OpenAI API.

- FR-AI-03: Mission generation shall produce a daily mission of three tasks from user context.

- FR-AI-04: Behaviour summaries shall generate the weekly natural-language analysis shown in the Signal tab.

- FR-AI-05: Reflection analysis shall interpret user reflections and feed them back into signal scoring and missions.

- FR-AI-06: No AI feature beyond these five shall be built in the MVP.

6.2 Non-Functional Requirements

- Performance: the For You feed shall scroll at 60 fps on mid-range devices; media shall begin playback within 1.5 s on a typical Jamaican mobile connection.

- Privacy & consent: behavioural tracking is sensitive; the app shall obtain explicit, informed consent for behavioural data capture and provide a plain-language explanation of what is tracked and why. Compliance with Jamaica’s Data Protection Act shall be confirmed \[TBD\].

- Security: all data access shall be enforced by Supabase Row-Level Security; users shall only ever read/write their own behavioural and profile data. Secrets (OpenAI, Cloudinary, FCM) shall never be embedded in the client.

- Reliability: mission/streak state shall be durable and survive app restarts; offline task completion shall sync on reconnection.

- Accessibility: text shall meet WCAG AA contrast; the “calm/minimal” aesthetic shall not compromise legibility or touch-target size.

- Cost control: OpenAI usage shall be batched/cached (e.g., weekly summaries generated once) to keep per-user AI cost within budget \[TBD\].

- Scalability: architecture shall support the closed-beta cohort comfortably and scale to early public usage without re-platforming.

6.3 Open Questions

- Exact streak reset rules (grace days? timezone handling for Jamaica/AST?).

- Definition and formula of the signal score (inputs, weighting, range).

- Which alignment-survey instrument is used to measure the core thesis, and at what cadence.

- Whether content (short videos) is hosted on Cloudinary or linked externally, and the licensing implications of curated content.

- Minimum cohort size and recruitment channel for the closed beta.

7\. Design Specification

7.1 Overview

North’s design philosophy is “quiet ambition.” Where attention apps are hyperstimulating, cluttered, childish, and “productivity-bro,” North must feel calm, cinematic, intentional, minimal, premium, and emotionally intelligent. The interface should slow the user down rather than speed them up: generous negative space, restrained motion, and a single clear action per screen. Every design decision is tested against one question — does this make the user feel more directed, or just more stimulated?

7.2 Brand / Visual Identity

Mood: cinematic and composed. A dark, deep-slate foundation with a restrained, muted accent (e.g., a quiet teal) signals premium calm rather than energetic urgency. Imagery and video are presented full-bleed and unhurried. No badge spam, no aggressive reds, no confetti-style gamification. Specific palette, logo, and motion tokens are

**\[TBD — to be finalised with a design pass before Milestone 1 UI build.\]**

7.3 Typography

A single, highly legible humanist sans-serif used across two or three weights; large, confident headings paired with comfortable body sizing for long-form reading of founder stories and reflections. Type choices must preserve WCAG AA contrast on the dark foundation. Final typeface \[TBD\].

7.4 Layout System

Mobile-first, single-column, thumb-reachable. Five-tab bottom navigation (For You, Mission, Signal, Opportunities, Profile). The For You feed is a full-screen vertical pager; the Mission tab centres a single mission card; the Signal tab favours clear, sparse data visualisation over dense dashboards. One primary action per screen.

7.5 Component Patterns

- Content card (feed): full-bleed media with minimal overlaid actions (like / save / share).

- Mission card: title, three-task checklist, progress bar, streak indicator — calm, not gamified-loud.

- Signal callout: a single sentence of honest behavioural feedback with a Signal/Noise tag and an accuracy thumb.

- Opportunity card: title, type tag, key details, save/apply action.

- Profile growth stats: understated visualisation emphasising change over time.

7.6 Accessibility

WCAG AA contrast minimum; touch targets ≥44×44 pt; captions/transcripts for video content where feasible; respect OS-level reduced-motion settings (the calm aesthetic should degrade gracefully to even less motion).

7.7 Module-Specific Patterns

Onboarding uses one question per screen with a progress indicator to keep the 7-question flow unhurried. The Signal tab’s weekly analysis is presented as a short narrative plus one or two sparse charts rather than a metrics wall, reinforcing reflection over surveillance.

8\. Data Model / Architecture

8.1 Architecture Overview

Client: React Native + Expo. Backend & data: Supabase (PostgreSQL + Supabase Auth + Row-Level Security). AI: OpenAI API, called from secure server-side functions (Supabase Edge Functions) — never directly from the client. Media storage: Cloudinary. Analytics: PostHog. Push notifications: Firebase Cloud Messaging. Payments (Stripe) are deferred. Weekly behaviour summaries and signal classification are generated by scheduled server-side jobs to control AI cost.

8.2 Entities / Tables (initial)

| **Entity** | **Purpose / Key fields** |
|----|----|
| users / profiles | Identity, display fields, goals, focus areas, current signal score. |
| onboarding_responses | The 7 answers per user; inputs to mission generation and recommendation. |
| content_items | Curated content: type, media URL (Cloudinary), category, source/attribution. |
| content_categories | The 10 fixed categories (Purpose, Careers, …, Mental clarity). |
| topics / user_topic_follows | Followable topics and the follow relationship. |
| content_interactions | The Signal moat: view, dwell, like, save, share, skip events per user/content. |
| missions / mission_tasks | Mission definitions and their three tasks. |
| user_missions / user_mission_tasks | Per-user daily mission assignment and per-task completion/avoidance. |
| streaks | Per-user streak count, last-completed date, reset state. |
| signal_scores | Per-user signal score over time; weekly analysis snapshots. |
| opportunities / opportunity_categories | Manually uploaded opportunities and their types/filters. |
| user_saved_opportunities | Save/apply relationship per user. |
| opportunity_submissions | User-submitted opportunities awaiting review. |

8.3 Relationships

- A user has one profile, one set of onboarding_responses, many content_interactions, many user_missions, one streak record, and many signal_scores over time.

- A content_item belongs to one content_category and has many content_interactions.

- A mission has many mission_tasks; a user_mission references one mission and has many user_mission_tasks.

- An opportunity belongs to one or more opportunity_categories and has many user_saved_opportunities.

8.4 Conventions

- snake_case table and column names; UUID primary keys; created_at / updated_at audit timestamps on every table.

- Row-Level Security on all user-scoped tables so a user can only access their own behavioural and profile data.

- Behavioural events written append-only to content_interactions and the mission tables; analytics mirrored to PostHog.

- AI outputs (summaries, classifications) stored with the model/version and generation timestamp for auditability and cost tracking.

9\. Team

**Purpose:** *Makes responsibilities visible and assigns accountability clearly.*

9.1 Team Table

| **Name** | **Role** | **Skills / Strengths** | **Responsibilities** |
|----|----|----|----|
| Jordayne Price | Project Owner (Accountable) | Full-stack (React Native/Next.js, TypeScript), product, Caribbean market context | Overall delivery, product direction, architecture, build of core loop |
| \[object Object\] | Content curator | Editorial / Caribbean content sourcing | Curate the 50–100 launch content items; ongoing curation |
| \[object Object\] | Designer | Mobile UI, motion, brand | “Quiet ambition” design system, screen designs, accessibility |
| \[object Object\] | Opportunities admin | Sourcing/verification | Manually upload and vet launch opportunities |

*Note: if North launches as a solo build, confirm which of the above roles the Project Owner is also covering and which are deferred.*

9.2 Ownership Mapping (RACI)

| **Work Item** | **Accountable (A)** | **Responsible (R)** | **Consulted (C)** | **Informed (I)** |
|----|----|----|----|----|
| M1 Foundation & Activation | Jordayne Price | Jordayne Price | **\[TBD\] Designer** | Beta cohort |
| M2 Retention Loop | Jordayne Price | Jordayne Price | **\[TBD\] Content curator** | Beta cohort |
| M3 Signal & Discovery | Jordayne Price | Jordayne Price | **\[TBD\] Opps admin** | Beta cohort |
| Content curation | Jordayne Price | **\[TBD\] Curator** | Jordayne Price | — |

10\. Milestones & Key Activities

**Purpose:** *Clear checkpoints that move the project from start → finish.*

10.1 Milestone Plan

| **Milestone** | **“Done When…” Definition** | **Target** | **Owner** |
|----|----|----|----|
| M1 — Foundation & Activation | A new user can complete the 7-question onboarding and scroll a curated For You feed (like/save/share, topic follow) in the live app, with behavioural events captured. (Build steps 1–2.) | **\[TBD\]** | Jordayne Price |
| M2 — Retention Loop | An onboarded user receives a daily mission of three tasks, completes tasks with a working streak and progress bar, and sees their Profile reflect streaks and completed missions. (Build steps 3–4.) | **\[TBD\]** | Jordayne Price |
| M3 — Signal & Discovery | Signal tab shows a signal score, weekly analysis, time breakdown and Signal/Noise callouts; Opportunities tab serves a searchable, filterable, manually-uploaded feed with save/apply and submit-intake. Closed beta live. (Build steps 5–6.) | **\[TBD\]** | Jordayne Price |

10.2 Key Activities for Milestone 1

| **Activity** | **Owner** | **Support** | **Effort** | **Start** | **End** |
|----|----|----|----|----|----|
| Project scaffold: Expo app, Supabase project, Auth, RLS baseline | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |
| Build 7-question onboarding + persistence | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |
| Curate 50–100 content items | **\[TBD\]** | Jordayne Price | H | **\[TBD\]** | **\[TBD\]** |
| Build For You vertical feed + like/save/share + topic follow | Jordayne Price | — | H | **\[TBD\]** | **\[TBD\]** |
| Behavioural event capture + PostHog instrumentation | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |

10.3 Key Activities for Milestone 2

| **Activity** | **Owner** | **Support** | **Effort** | **Start** | **End** |
|----|----|----|----|----|----|
| AI mission generation (3 tasks from onboarding context) | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |
| Mission card, checklist, progress bar | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |
| Streak system + completion tracking | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |
| Profile tab (streaks, completed missions, saved items, stats) | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |

10.4 Key Activities for Milestone 3

| **Activity** | **Owner** | **Support** | **Effort** | **Start** | **End** |
|----|----|----|----|----|----|
| Signal score + weekly behaviour summary (OpenAI, scheduled job) | Jordayne Price | — | H | **\[TBD\]** | **\[TBD\]** |
| Signal/Noise classification + accuracy feedback | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |
| Opportunities feed: upload, search, filters, save/apply, submit-intake | Jordayne Price | **\[TBD\] Opps admin** | M | **\[TBD\]** | **\[TBD\]** |
| Closed-beta recruitment + alignment survey instrumentation | Jordayne Price | — | M | **\[TBD\]** | **\[TBD\]** |

11\. Resources

**Purpose:** *Confirms the plan matches available capacity.*

- **Team capacity (hours / availability): \[TBD — confirm weekly hours available, especially given concurrent commitments.\]**

- **Tools / systems needed:** React Native + Expo, Supabase (PostgreSQL, Auth), OpenAI API, Cloudinary, PostHog, Firebase Cloud Messaging. Stripe deferred.

- **Vendors / partners involved:** OpenAI, Supabase, Cloudinary, PostHog, Firebase (all usage-based).

- **Budget required: \[TBD — estimate monthly OpenAI + Cloudinary + Supabase + FCM spend for the beta cohort.\]**

12\. Current State

**Purpose:** *Documents where we are today so progress is trackable.*

12.1 Accomplishments So Far

- Product concept, five-tab structure, AI scope, tech stack, design philosophy, and build order defined (this brief).

- This operating document drafted (v0.1).

12.2 In Progress Now

- Operating-document finalisation; resolving the **\[TBD\]** items below.

12.3 Next 7–14 Days Focus

- Confirm owner/team, dates, budget, and KPI targets.

- Scaffold the Expo + Supabase project and Auth/RLS baseline (M1 start).

- Begin curating the first batch of launch content.

13\. Unknowns & Open Questions

**Purpose:** *Makes uncertainty visible so it can be resolved quickly.*

| **Question / Unknown** | **Why It Matters** | **Owner** | **Due Date** | **Status** |
|----|----|----|----|----|
| Signal score formula & inputs | Defines the core differentiator; blocks M3 build | Jordayne Price | **\[TBD\]** | Open |
| Alignment-survey instrument | It is the primary success measure of the thesis | Jordayne Price | **\[TBD\]** | Open |
| Streak reset / timezone rules | Affects retention loop correctness | Jordayne Price | **\[TBD\]** | Open |
| Content licensing for curated media | Legal risk in hosting/curating third-party content | Jordayne Price | **\[TBD\]** | Open |
| Beta cohort size & channel | Determines statistical power of KPIs | Jordayne Price | **\[TBD\]** | Open |

14\. Blockers & Dependencies

**Purpose:** *Separates “hard stop” issues from “workaround possible” items.*

14.1 Blockers (Hard Stop)

| **Blocker** | **Impact** | **Owner** | **Action** | **Status** |
|----|----|----|----|----|
| No confirmed owner/team beyond founder | Sets realistic scope & timeline | Jordayne Price | Confirm solo vs. team | Open |

14.2 Dependencies (Workaround Possible)

| **Dependency** | **Impact** | **Workaround Plan** | **Owner** | **Status** |
|----|----|----|----|----|
| OpenAI API availability/cost | Powers 4 of 5 AI features | Cache/batch; degrade to templated summaries | Jordayne Price | Open |
| Curated content supply | Feed needs 50–100 items | Founder curates if no curator | Jordayne Price | Open |
| Manually sourced opportunities | Opportunities tab content | Founder uploads a starter set | Jordayne Price | Open |

14.3 Critical Dependencies (Call Out Separately)

- Behavioural event capture must be correct from M1 — it is the data foundation of the Signal moat; defects here cascade into M3 and the core thesis.

15\. Risks & Mitigation

**Purpose:** *Prevent surprises and reduce delivery failure.*

| **Risk** | **Likelihood** | **Impact** | **Mitigation** | **Owner** |
|----|----|----|----|----|
| Thesis unproven — users don’t feel more aligned | M | H | Measure alignment lift early with a real cohort; treat as kill/redesign signal | Jordayne Price |
| Scope creep (AI/recommendation/scraping pulled forward) | H | M | Hard guardrails in Section 5; manual curation first; only 5 AI features | Jordayne Price |
| Solo-builder capacity overrun | H | H | Three milestones, ruthless cuts to Out-of-Scope; confirm hours in Resources | Jordayne Price |
| Privacy backlash over behavioural tracking | M | H | Explicit consent, plain-language disclosure, RLS, DPA check | Jordayne Price |
| AI cost runs hot per user | M | M | Batch/cache weekly jobs; cap usage; monitor spend | Jordayne Price |
| Content/opportunity supply too thin to test behaviour | M | M | Commit to 50–100 curated items + starter opportunities before beta | Jordayne Price |

16\. Stakeholders, Communication, Cadence

**Purpose:** *Ensures the right people get the right updates consistently.*

16.1 Stakeholders

| **Stakeholder** | **Role / Interest** | **What They Need** | **Frequency** | **Channel** |
|----|----|----|----|----|
| Jordayne Price | Owner / builder | Full status, decisions | Continuous | Self / tracker |
| Beta cohort | End users / testers | Working app, clear asks for feedback | Per release | **\[TBD\]** |
| \[object Object\] | Guidance / accountability | Milestone progress, key risks | **\[TBD\]** | **\[TBD\]** |

16.2 Reporting Cadence

- **Weekly update: \[TBD — set a fixed weekly review slot\]**

- **Tracker update day/time: \[TBD\]**

- **Status format:** Green / Amber / Red

16.3 Escalation Path

- **Escalate blockers after: \[TBD\] days**

- **Escalation owner:** Jordayne Price

- **Decision-maker(s):** Jordayne Price

17\. Decision Log

**Purpose:** *Records final decisions and ensures everything points back to the source of truth.*

| **Decision** | **Date** | **Decided By** | **Impact** |
|----|----|----|----|
| MVP scoped to 5 tabs only | 28 May 2026 | Jordayne Price | Bounds build; defers all extras |
| Manual content curation before AI recommendation | 28 May 2026 | Jordayne Price | Lowers M1 cost/risk; data first |
| Manual opportunity upload before scraping | 28 May 2026 | Jordayne Price | Avoids early scraping complexity/legal risk |
| Only 5 AI features in MVP | 28 May 2026 | Jordayne Price | Controls AI cost and scope |
| Stripe / monetisation deferred | 28 May 2026 | Jordayne Price | Focus on proving the alignment loop |
| DEC-06 — Conform repo to documented stack (remove Better-Auth, Drizzle, Polar; adopt Supabase Auth + RLS + Edge Functions + supabase-js; retain `apps/web` as admin-only surface) | 28 May 2026 | Jordayne Price | Unblocks INFRA-02–05 and all M1–M3 data work; supersedes Better-T-Stack scaffold defaults |
| DEC-07 — Signal score implementation lands per [`docs/north-core-metrics-spec.md`](./north-core-metrics-spec.md) (rules-based PL/pgSQL `compute_signal_score` on `pg_cron` daily + AI summary/callout layer in an Edge Function calling OpenAI on `pg_cron` weekly) | 28 May 2026 | Jordayne Price | Unblocks tracker DEC-03 and all of M3 (Signal & Discovery); honours operating doc §8.1 "weekly behaviour summaries and signal classification are generated by scheduled server-side jobs" |
| DEC-08 — Streak rules implemented per metrics spec DEC-05: AST day boundary (UTC−4, no DST) with 03:59 grace cutoff via `public.ast_day`; rest-credit model (2 per rolling 7, auto-consumed, "rhythm intact" framing — no loss-framing); `streaks` upserted by trigger on `user_mission_tasks` | 28 May 2026 | Jordayne Price | Resolves tracker DEC-05; gives Signal's K input and the 28-day consistency view a server-computed source of truth that matches the rhythm-streak surface |
| DEC-09 — Alignment instrument scaffolded per metrics spec DEC-04: MLQ presence-of-meaning subscale (Steger 2006) chosen as the Layer-2 baseline/day-28 scale; schema (`alignment_scales`, `alignment_scale_items`, `baseline_endpoint_responses.scale_id`, `compute_alignment_composite` + trigger, `weekly_pulse_due`); items seeded as PLACEHOLDERS and RLS-gated behind `license_status = 'licensed'` until operator pastes verbatim text from source | 28 May 2026 | Jordayne Price | Resolves tracker DEC-04; thesis-claim instrument is in place. Items remain pending operator acquisition (free for non-commercial use per Steger's terms) — see runbook in metrics-spec DEC-04 appendix |
| DEC-10 — Content licensing model is **hybrid**: every curated item declares `license_type` (link-out / cloudinary-hosted / original / unknown) and progresses through `license_status` (draft → cleared → blocked). RLS public-read policies on `content_items` and `opportunities` require `license_status = 'cleared'` + populated attribution/URL — placeholders never reach a client | 28 May 2026 | Jordayne Price | Resolves tracker DEC-06; gives the admin curation flow a structural way to enforce attribution + permission evidence before content goes live, without dictating link-out vs. host as a global default |
| DEC-11 — KPI targets §3.3 confirmed: onboarding completion ≥85% (M1) · daily mission completion ≥40% (M2) · 7-day streak ≥25% (M2) · D7 retention ≥30% (M2) · alignment lift +1.0pt on 5-pt scale (M3) · signal classification accuracy ≥75% "feels accurate" (M3). Alignment-lift target confirmed **with demand-bias caveat in force** per metrics spec DEC-04 control #3 | 28 May 2026 | Jordayne Price | Resolves tracker DEC-07; converts the §3.3 table from "proposed starting points" to project commitments, with re-tuning permitted after cohort 1 (would require a new DEC entry) |
| DEC-12 — Lint/format tool is **Biome** (kept, not swapped to ESLint+Prettier). Pre-commit hooks via lefthook: `biome check --write` on staged files + workspace `tsc --noEmit`. Root scripts: `bun run check` (fix), `bun run check:ci` (check-only), `bun run check-types` (turbo) | 28 May 2026 | Jordayne Price | Resolves tracker SETUP-03; one tool, faster than ESLint+Prettier, matches the Better-T-Stack default; pre-commit hooks catch lint/format/type errors before commit |
| DEC-13 — EAS Build profiles: **dev** (internal, simulator-only iOS + APK), **preview** (internal, real-device TestFlight + APK), **production** (store, App Store + Google Play Bundle, autoIncrement). Each profile carries an `APP_ENV` env and a matching EAS Update channel. iOS bundle id + Android package = `app.north.client` | 28 May 2026 | Jordayne Price | Resolves tracker SETUP-04; gives the native app three repeatable build pipelines + a clear path to OTA via channels |
| DEC-14 — CI via GitHub Actions: `.github/workflows/ci.yml` runs on every PR + push to `main`: `bun install --frozen-lockfile`, `bun run check:ci` (Biome), `bun run check-types` (turbo), `bun run build --filter=web`, and an `expo config --type prebuild` dry-run for native. Turbo cache is keyed per-SHA with branch fallback | 28 May 2026 | Jordayne Price | Resolves tracker SETUP-05; every PR is gated by the same lint/type/build that runs locally pre-commit, so regressions can't sneak past review |
| DEC-15 — Secrets pattern is **native per platform**: Supabase secrets for Edge Functions, EAS secrets for native build-time env, host env for the web admin. `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` are the only env names allowed in client-bundled files; every other server-only key is checked at pre-push (lefthook) and in CI via `scripts/check-client-bundle-secrets.sh`. No Doppler / Vault in v0 | 28 May 2026 | Jordayne Price | Resolves tracker SETUP/secrets; honours operating doc §6.2 ("secrets shall never be embedded in the client") with a tractable, low-vendor pattern that's enforced mechanically |

### DEC-06 — Conform repo to documented stack

**Decision (28 May 2026, Jordayne Price).** The implementation stack is fixed as: Expo + React Native (`apps/native`) as the product surface; Supabase (PostgreSQL + Auth + Row-Level Security + Edge Functions) as backend and data layer; `supabase-js` as the only client SDK; OpenAI invoked only from Edge Functions; Cloudinary for media; PostHog for analytics; FCM for push. Better-Auth, Drizzle, and Polar are removed from the scaffold. `apps/web` is retained as an internal admin surface for content curation (FR-FEED-04) and opportunity upload (the "manual opportunity upload before scraping" decision above), using the Supabase service role server-side; it is not exposed as a product API.

**Rationale.** The operating document is the source of truth, and Section 6.2 requires that *all data access shall be enforced by Supabase Row-Level Security.* The scaffolded Better-T-Stack uses Drizzle and Better-Auth, which connect to Postgres as the database owner / service role and bypass RLS by design — they cannot satisfy that requirement as-is. Re-spec'ing the security model to fit the scaffold (the alternative) would require dropping RLS, building a per-request application-level authorisation layer, and diverging from the doc on a load-bearing requirement; that path was rejected.

**Impact.** Unblocks the INFRA tasks (project tracker) that were blocked on this reconciliation, and all M1–M3 data work. Removes ~10 files of Better-Auth/Polar/Drizzle wiring and the `packages/db` workspace; adds `packages/supabase` (thin client factories), the `supabase/` migrations directory with RLS policies, and PostHog SDKs. The `/north` design prototype is unaffected.

### DEC-07 — Signal score implementation (rules-based score + AI summary layer)

**Decision (28 May 2026, Jordayne Price).** The signal score (tracker DEC-03) is implemented per the spec in [`docs/north-core-metrics-spec.md`](./north-core-metrics-spec.md). Two layers, one PR:

1. **Score layer (rules-based, no LLM).** A PL/pgSQL function `public.compute_signal_score(uid uuid, week_ending date)` computes the A/C/K/V inputs from `user_mission_tasks`, `content_interactions`, `streaks`, and `user_focus_areas`; applies the spec's weights (0.45·A + 0.25·C + 0.30·K) and dampener (1 − 0.20·V); honours the cold-start guards; UPSERTs to `signal_scores` with an `inputs jsonb` payload. Scheduled daily at 08:00 UTC (04:00 AST) via `pg_cron`.
2. **AI summary layer (AI-04/05).** A Supabase Edge Function `signal-summary` calls OpenAI (`gpt-4o-mini`, JSON-mode) with the user's score breakdown and focus areas, and writes a calm one-paragraph weekly summary plus 0–2 callouts into a new `signal_summaries` table. Triggered weekly on Sunday 09:00 UTC (05:00 AST) via `pg_cron` + `pg_net`. Prompt is committed in code and versioned via the `prompt_version` column for A/B comparison.

**Schema additions.** `user_mission_tasks.abandon_count int` (client-bumped, drives V); `signal_scores.inputs jsonb` (A/C/K/V breakdown); new `signal_summaries` table with own-rows RLS read policy.

**Rationale.** The metrics spec is the source of truth; this lands it in code so every M3 task can build on the same primitives. The two-layer split honours the spec's hard line ("no LLM in the score itself"). The cron-based architecture honours operating doc §8.1: *"Weekly behaviour summaries and signal classification are generated by scheduled server-side jobs to control AI cost."*

**Impact.** Unblocks all of M3 (Signal & Discovery). Introduces the first `pg_cron`-scheduled background work in the project and the first OpenAI integration. V (Avoidance) will be near-zero for most v0 users per the spec reviewer's note — that's literal-spec behaviour, to be revisited if cohort 1 data shows V is permanently cosmetic.

### DEC-08 — Streak rules implementation (AST day, rest credits, no loss-framing)

**Decision (28 May 2026, Jordayne Price).** Streak rules (tracker DEC-05) are implemented per [`docs/north-core-metrics-spec.md`](./north-core-metrics-spec.md) DEC-05:

- **AST day boundary.** `public.ast_day(ts timestamptz) returns date` folds a UTC timestamp into the user's local calendar day (America/Jamaica, permanent UTC−4, no DST). The 03:59 local-time grace cutoff is built in — completions between 00:00 and 03:59 local count toward the *previous* day's row.
- **State classification.** `public.recompute_streak_for_day(uid, day)` reads `user_mission_tasks` for the effective AST day and classifies state: `0` miss · `1` active (≥ 1 task done) · `2` directed (3/3 mission tasks done). Active-day count feeds K in the signal score; directed-day count feeds the rhythm streak.
- **Rest credits.** `public.apply_rest_credits(uid, through_day)` auto-consumes up to **2 rests per rolling 7** by flipping `state=0` days to `state=3` (rest) when the rolling window allows. Framing in the UI is *"You took a rest day. Your rhythm is intact"*, never *"Streak saved!"*
- **Trigger.** `trg_streak_on_task_change` on `user_mission_tasks` (AFTER INSERT OR UPDATE OF `done`, `completed_at`) recomputes the affected day's window and re-applies rest credits across the 28-day eval window.
- **Rhythm read.** `public.compute_rhythm_streak(uid, as_of)` returns the current run of `state in (2, 3)` days backwards from `as_of`. The 28-day consistency view reads `streaks` directly and persists through any rhythm break — the spec's explicit "no zeroing-shame" promise.

**Rationale.** The metrics spec is the source of truth and explicitly resolves the "calm streak" tension — measuring rhythm without punishing the break. Implementing AST as a single helper (no timezone DB lookup) keeps the math obvious. Rest as auto-consumed credit lets the streak hold without manual user intervention or notification panic.

**Impact.** Resolves tracker DEC-05. Gives the Signal score's K input and the 28-day consistency view a server-computed source of truth that matches the rhythm-streak surface, so K and the streak count never disagree about whether you showed up (the "one log, two thresholds" rule from the metrics spec interlock section).

### DEC-09 — Alignment instrument (MLQ presence-of-meaning scaffold)

**Decision (28 May 2026, Jordayne Price).** The Layer-2 alignment instrument (tracker DEC-04, per [`docs/north-core-metrics-spec.md`](./north-core-metrics-spec.md) DEC-04) uses the **MLQ presence-of-meaning subscale** (Steger, Frazier, Oishi & Kaler, 2006 — *Journal of Counseling Psychology* 53(1), 80–93). Five items, 1–7 Likert scale, short, well-validated, English.

Schema lands now; **items remain pending operator acquisition** from the source. The migration seeds the scale with `license_status = 'pending_acquisition'` and placeholder prompts; the RLS policy on `alignment_scale_items` requires the parent scale's `license_status = 'licensed'` so placeholders are **structurally invisible to clients** until the operator pastes verbatim text and flips the license. See the runbook in the metrics-spec DEC-04 appendix.

The metrics-spec hard constraint (*"Do not invent this scale… Obtain the actual items from the source publication and check licensing… reproducing or paraphrasing the items yourself breaks their validity"*) is honoured: this PR does not invent or paraphrase any item.

**Schema additions.** `public.alignment_scales`, `public.alignment_scale_items` (RLS-gated on parent license_status), `baseline_endpoint_responses.scale_id`, `public.compute_alignment_composite()` + BEFORE INSERT/UPDATE trigger on `baseline_endpoint_responses`, `public.weekly_pulse_due(uid, as_of)` for Layer-1 dispatch.

**Rationale.** Selecting a scale + getting infrastructure in place unblocks tracker DEC-04 immediately. Using the license_status gate as a deploy-safe placeholder lets the schema and code paths land now and be exercised end-to-end without inventing prohibited content. MLQ is the lightest of the four candidate scales in the metrics spec (5 items vs. 7–14), is freely available for non-commercial use, and has the longest validation history.

**Impact.** Resolves tracker DEC-04. The Layer-2 surveys (onboarding ONB-05 + day-28 re-measure) and Layer-1 weekly pulse have a server-side source of truth. Day-28 scheduled re-measure trigger + native onboarding/Signal-tab integration are M3 product work, not this PR.

### DEC-10 — Content licensing model (hybrid; cleared-only RLS gate)

**Decision (28 May 2026, Jordayne Price).** Curated content (`content_items`) and opportunities (`opportunities`) adopt a **hybrid** licensing model — neither link-out nor Cloudinary-hosting is the global default. Every row declares both:

- **`license_type`** (`content_items` only) — one of `link-out`, `cloudinary-hosted`, `original` (North-authored), `unknown`. Opportunities are link-out by construction.
- **`license_status`** — one of `draft`, `cleared`, `blocked`. A `cleared` row is one the admin has confirmed has clear attribution + a valid place to read it from (`external_url` for link-out, `cloudinary_public_id` for hosted). A `blocked` row is one we've flagged as not-publishable (e.g., permission rescinded or licence expired).

The public-read RLS policies are tightened to require `license_status = 'cleared'` in addition to the existing `published_at` window. **Draft and blocked rows are structurally invisible to clients**, even if `published_at` is set. A CHECK constraint additionally rejects flipping to `cleared` without populated attribution + readable URL — admin can't accidentally publish unattributed content.

**Schema additions.**
- `content_items`: `license_type`, `cloudinary_public_id`, `attribution_text`, `permission_evidence_url`, `license_status`
- `opportunities`: `license_status`, `attribution_text`, `permission_evidence_url`
- CHECK constraints on both tables enforcing the `cleared` prerequisites
- Replaces `content_items_read_published` and `opportunities_read_published` RLS policies

**Rationale.** Hybrid reflects the realistic mix of M1 curation — some essays will be Caribbean originals or commissioned (host on Cloudinary for brand consistency); others will be external pieces we link out to with attribution; the data layer should support both rather than forcing one. The `license_status` state machine moves the legal-clearance gate from "documented in a sidecar spreadsheet" to a database invariant that RLS enforces automatically.

**Impact.** Resolves tracker DEC-06. Admin UI surfaces `license_type` + `license_status` in the curation tables; full add/edit/upload-to-Cloudinary flows are M1 admin work, not this PR. Existing curation rows (none yet in v0) get sensible defaults (`license_status = 'draft'`) and must be cleared before they become visible.

### DEC-11 — KPI targets confirmed (§3.3)

**Decision (28 May 2026, Jordayne Price).** The six KPIs in §3.3 are committed at the numbers previously listed as proposed starting points. The `[TBD]` markers are removed; `By When` is set to the milestone in which each KPI must first be measurable.

| **Metric** | **Target** | **By When** |
|---|---|---|
| Onboarding completion rate | ≥ 85% | end of M1 |
| Daily mission completion rate (active users) | ≥ 40% | end of M2 |
| 7-day streak rate | ≥ 25% | end of M2 |
| D7 retention | ≥ 30% | end of M2 |
| Self-reported alignment lift (onboarding → wk4) | +1.0 pt on 5-pt scale | end of M3 |
| Signal classification accuracy (user-rated) | ≥ 75% "feels accurate" | end of M3 |

**Caveat on the alignment-lift number.** The metrics spec DEC-04 demand-bias section argues against pre-committing to a +1.0pt target because survey-only lift from survivors is the most demand-biased measurement available. The number is confirmed here as a working commitment, but with the three demand-bias controls held in force:

1. **Triangulate.** A real hit = alignment-lift +1.0pt **and** signal score climbing **and** mission completion holding. A +1.0pt move alone is treated as demand bias, not a hit.
2. **Measure the churned.** Lift is segmented to include users who left (via their last weekly pulse), not just week-4 survivors.
3. **Re-tune willingly.** After cohort 1 returns data, the target may be re-set as a within-person effect size (e.g., Cohen's *d* ≈ 0.3). Re-tuning any of the six numbers requires a new DEC entry; it does not invalidate this one.

**Rationale.** The numbers in §3.3 were already drafted by the Project Owner and align with consumer-app industry benchmarks (D7 retention ≥ 30%, onboarding completion ≥ 85%, mission-completion ≥ 40%). Leaving them as `[TBD]` defers a decision that any review of progress will need to make anyway. The demand-bias caveat lets the alignment-lift commitment survive contact with survey reality.

**Impact.** Resolves tracker DEC-07. Removes 12 `[TBD]` markers from §3.3 (6 targets × 2 columns). The numbers become measurable as soon as the relevant milestone exits, and re-tuning is bounded by a new DEC requirement so adjustments are deliberate.

### DEC-12 — Lint/format tool kept as Biome; pre-commit hooks via lefthook

**Decision (28 May 2026, Jordayne Price).** Tracker SETUP-03 ("Configure ESLint + Prettier + typecheck; add pre-commit hooks") is resolved by keeping **Biome** (already in `biome.json`) rather than swapping to ESLint + Prettier. Pre-commit hooks are added via [lefthook](https://lefthook.dev).

**What's in.**
- `biome.json` (kept) — formatting + linting, with the existing folder-scoped a11y overrides for `apps/web/src/app/north/**` (the design prototype's decorative SVGs).
- `lefthook.yml` — pre-commit runs `bunx biome check --write` on staged JS/TS/JSON/CSS files (auto-stages fixes) and `bun run check-types` across the workspace.
- Root scripts: `bun run check` (apply fixes), `bun run check:ci` (check-only, fails on diff, used by CI), `bun run check-types` (turbo runs `tsc --noEmit` per package).
- `check-types` scripts added to every workspace (`apps/web`, `apps/native`, `packages/env`, `packages/supabase`) so turbo actually exercises them. `packages/ui` already had one.
- Hooks install via the root `postinstall` script (`lefthook install`); no manual setup required. Bypass for emergencies via `git commit --no-verify`; never in CI.

**Rationale.** Biome was already configured and working. Swapping to ESLint + Prettier would add a plugin sprawl (`eslint-config-next`, `eslint-plugin-react-native`, `prettier-plugin-*`), run slower, and offer no benefit for a single-developer project. The Better-T-Stack default landed at Biome for the same reasons; we keep it.

**Impact.** Resolves SETUP-03. Unblocks SETUP-05 (CI runs `bun run check:ci` + `bun run check-types`). No code paths change; this is pure tooling.

### DEC-13 — EAS Build profiles (dev / preview / production)

**Decision (28 May 2026, Jordayne Price).** Tracker SETUP-04 is resolved by `apps/native/eas.json` defining three build profiles:

| Profile      | Distribution | Channel     | iOS                          | Android        |
| ------------ | ------------ | ----------- | ---------------------------- | -------------- |
| `dev`        | internal     | `dev`       | simulator + dev client       | APK            |
| `preview`    | internal     | `preview`   | real device (TestFlight)     | APK            |
| `production` | store        | `production`| App Store                    | AAB, autoIncrement |

Each profile carries an `APP_ENV` env so runtime can branch on environment. The `channel` field aligns with EAS Update channels when OTA lands (M2/M3). iOS bundle identifier + Android package are both `app.north.client`. `runtimeVersion.policy = "appVersion"` keeps OTA-compatible bundles tied to the marketing version.

**Operator setup.** After this PR merges: `cd apps/native && eas login && eas init` to link the project to the operator's Expo account; commit the resulting `expo.extra.eas.projectId`. Native build-time env (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, future `EXPO_PUBLIC_POSTHOG_*`) lives in EAS secrets, not in `apps/native/.env` — see [`docs/secrets.md`](./secrets.md) (DEC-15).

**Submit credentials.** `eas.json` `submit.production` ships with placeholder Apple/Google values that must be replaced once the App Store + Play Console accounts exist.

**Rationale.** Three profiles is the canonical EAS pattern; deviation costs more than it buys. APK for internal Android distribution avoids the Play upload step for QA builds; AAB for production is store-required. `autoIncrement: true` on production prevents build-number collisions during release.

**Impact.** Resolves SETUP-04. Gives the native app a repeatable pipeline from local-dev → internal QA → store release without ad-hoc Xcode/Android Studio configuration per build.

### DEC-14 — CI on GitHub Actions

**Decision (28 May 2026, Jordayne Price).** Tracker SETUP-05 is resolved by `.github/workflows/ci.yml`. The `check` job runs on every pull request to `main` and every push to `main`:

1. Checkout · `actions/checkout@v4`
2. Bun setup · `oven-sh/setup-bun@v2` pinned to `1.3.1`
3. Turbo cache restore (`.turbo/`, SHA-keyed with branch fallback)
4. `bun install --frozen-lockfile`
5. `bun run check:ci` — Biome check-only (fails on diff)
6. `bun run check-types` — turbo runs `tsc --noEmit` per workspace
7. `bun run build --filter=web` — Next.js production build
8. `bunx expo config --type prebuild` (dry-run) for the native app — validates the Expo config without invoking EAS

CI exports stub Supabase env vars so `@t3-oss/env`'s build-time validation passes. **Real secrets never enter CI** — they live in Supabase secrets / EAS secrets / the host's environment (per DEC-15).

`concurrency` cancels in-progress runs on PR pushes to keep the queue short; main-branch runs are not cancelled.

**Rationale.** The same set of checks runs in pre-commit (lefthook) and in CI — pre-commit is defense-in-depth + fast feedback for the developer; CI is the gate that catches anything bypassed locally. Building web in CI catches Next.js typed-route regressions that pure `tsc` misses. The native prebuild dry-run is cheap and catches `app.json` / plugin breakage without paying the EAS minutes.

**Impact.** Resolves SETUP-05. Every PR gets the same checks; broken main-branch builds get a red status check within ~2 minutes.

### DEC-15 — Secrets pattern (native per platform; mechanical leak check)

**Decision (28 May 2026, Jordayne Price).** Tracker SETUP/secrets is resolved with a **native-per-platform** pattern — no Doppler, no Vault, no central sync — and a `scripts/check-client-bundle-secrets.sh` that runs pre-push and in CI to enforce *operating doc §6.2: "Secrets (OpenAI, Cloudinary, FCM) shall never be embedded in the client."*

**Where each secret lives.**

| Platform | Secrets | Tool |
| --- | --- | --- |
| Supabase Edge Functions | `OPENAI_API_KEY`, `SUMMARY_TRIGGER_SECRET`, future Cloudinary signing key | `supabase secrets set` |
| Supabase Postgres (for `pg_cron`'s `net.http_post` call) | `app.functions_url`, `app.summary_trigger_secret` | `alter database postgres set …` |
| Web admin host (Vercel/CF/Fly) | `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`, any server-only key | Host's env-var UI |
| EAS (native build-time env) | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, future `EXPO_PUBLIC_POSTHOG_*` | `eas secret:create` |
| Local dev | All of the above as `.env` files (gitignored) | Copy from `.env.example` |

**The naming rule.** Only `NEXT_PUBLIC_*` (web) and `EXPO_PUBLIC_*` (native) env names are allowed inside client-bundled files. Every other server-only name (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_URL`, `SUMMARY_TRIGGER_SECRET`, `POSTHOG_API_KEY`) is checked against a whitelist of *client-bundlable paths* by `scripts/check-client-bundle-secrets.sh`. The check runs:

1. **Pre-push** (lefthook): blocks `git push` if a violation exists locally.
2. **CI** (`.github/workflows/ci.yml`): same script; gates the PR.
3. **Manual** (`bun run check:secrets`): for ad-hoc audits.

Documentation is in [`docs/secrets.md`](./secrets.md) including rotation guidance and per-environment setup commands.

**What's deliberately deferred.** No Doppler / Vault / 1Password Connect in v0; revisit if the project scales past one developer or rotation becomes a recurring chore. No encrypted env files in git. No auto-injection of real secrets into CI — CI uses stubs.

**Rationale.** The smallest blast-radius pattern: each secret lives where it's used, never copied. Doppler would add a vendor and a sync step for negligible v0 benefit. The mechanical leak check is the load-bearing piece — it makes the "no client-bundled secrets" rule a structural property of the repo rather than a careful-review discipline.

**Impact.** Resolves SETUP/secrets. Closes the §6.2 commitment with mechanical enforcement. CI gains one fast script; lefthook gains a pre-push hook (defense-in-depth).

18\. Supporting Documents

| **Description**                   | **Supporting Document Link** |
|-----------------------------------|------------------------------|
| Project tracker                   | **\[TBD\]**                  |
| Folder link (source of truth)     | **\[TBD\]**                  |
| Meeting notes link                | **\[TBD\]**                  |
| Designs (“quiet ambition” system) | **\[TBD\]**                  |
| Original product brief            | This document, Sections 1–8  |
