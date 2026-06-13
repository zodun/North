// Minimal class-name joiner for the shadcn-style ui primitives. Kept dependency
// free (no clsx / tailwind-merge) — callers pass plain class strings.
export function cn(
	...classes: Array<string | false | null | undefined>
): string {
	return classes.filter(Boolean).join(" ");
}
