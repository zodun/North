# North · native (Expo)

The product surface (per operating-doc DEC-06). Uses Supabase via
`@north/supabase/native`.

## Local development

```bash
bun run dev:native      # from repo root
# or
cd apps/native && bun run dev
```

Press `i` for iOS simulator, `a` for Android emulator. Real-device
testing uses the dev build profile (below).

## EAS Build profiles (operating-doc DEC-13)

Three profiles live in `eas.json`:

| Profile      | Distribution | Channel     | Purpose                                        |
| ------------ | ------------ | ----------- | ---------------------------------------------- |
| `dev`        | internal     | `dev`       | Dev client; simulator + tethered real devices  |
| `preview`    | internal     | `preview`   | Internal QA; TestFlight + Android APK          |
| `production` | store        | `production`| App Store + Google Play (`autoIncrement: true`)|

One-time operator setup:

```bash
cd apps/native
npm i -g eas-cli           # or: bun add -g eas-cli
eas login
eas init                   # links this project to your Expo account
```

After `eas init`, `app.json` gains an `expo.extra.eas.projectId` value
— commit that.

### Building

```bash
bun run build:dev:ios          # dev client, iOS simulator
bun run build:dev:android      # dev client, APK
bun run build:preview:ios      # internal preview, iOS
bun run build:preview:android  # internal preview, APK
bun run build:production       # both platforms; auto-bumps build number
```

### Secrets for native build

Native build-time env vars live in EAS secrets, **not** in `apps/native/.env`
(which is for `expo start` only):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://<project-ref>.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key>
# Add EXPO_PUBLIC_POSTHOG_* when PostHog is wired in (M1).
```

Only `EXPO_PUBLIC_*`-prefixed vars are bundled into the client — see
[`docs/secrets.md`](../../docs/secrets.md) (SETUP-PR-H) for the full pattern.

### Submission

`production` profile only:

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

`eas.json` `submit.production` has placeholder values for Apple App
Store + Google Play credentials; replace them after your operator
linkage is complete.

## OTA updates

Channels in `eas.json` align with EAS Update channels. To wire OTA
later (M2/M3):

```bash
npx expo install expo-updates
# Configure runtimeVersion policy already set to 'appVersion' in app.json.
eas update --branch <dev|preview|production> --message "<change>"
```
