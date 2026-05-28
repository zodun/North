#!/usr/bin/env bash
# Link the local Supabase CLI to the dev or prod remote project.
# Reads supabase/projects.json (gitignored; copied from
# supabase/projects.example.json) for the project ref.
#
# Usage:
#   ./scripts/supabase-link.sh dev
#   ./scripts/supabase-link.sh prod
#
# Requires: supabase CLI + jq + a SUPABASE_ACCESS_TOKEN env var
# (Supabase personal access token from
# https://supabase.com/dashboard/account/tokens).

set -euo pipefail

env_name="${1:-}"
if [ "$env_name" != "dev" ] && [ "$env_name" != "prod" ]; then
    echo "✘ Usage: $0 <dev|prod>" >&2
    exit 64
fi

registry="supabase/projects.json"
if [ ! -f "$registry" ]; then
    cat <<EOF >&2
✘ $registry not found.

Copy the template and fill in your project refs:
    cp supabase/projects.example.json supabase/projects.json
    \$EDITOR supabase/projects.json

See docs/supabase-projects.md for how to create the dev + prod
projects and get their refs.
EOF
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "✘ jq is required (brew install jq)." >&2
    exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
    echo "✘ supabase CLI is required (brew install supabase/tap/supabase)." >&2
    exit 1
fi

ref=$(jq -r --arg env "$env_name" '.[$env].ref // empty' "$registry")
if [ -z "$ref" ] || [ "$ref" = "REPLACE_ME_DEV_REF" ] || [ "$ref" = "REPLACE_ME_PROD_REF" ]; then
    echo "✘ No '$env_name.ref' value (or it's still the placeholder) in $registry." >&2
    echo "  Edit $registry and set the ref from your Supabase Dashboard." >&2
    exit 1
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    cat <<EOF >&2
✘ SUPABASE_ACCESS_TOKEN is not set.

Create a personal access token at:
    https://supabase.com/dashboard/account/tokens

Then:
    export SUPABASE_ACCESS_TOKEN=sbp_...
EOF
    exit 1
fi

echo "▸ Linking to $env_name (ref: $ref)…"
supabase link --project-ref "$ref"
echo "✓ Linked. Subsequent supabase commands operate on $env_name."
