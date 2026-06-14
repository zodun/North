// Strip em dashes and en dashes from user-facing copy.
//
// Product rule: users never see — or –. A dash between two numbers becomes
// " to " (so "10–20 minutes" reads "10 to 20 minutes"); any other dash becomes
// a comma. Mirrors migration 0053 and the edge functions' stripDashes(), so
// AI-generated copy matches the cleaned seed data.
export function cleanCopy<T extends string | null | undefined>(s: T): T {
	if (s == null) return s;
	return (s as string)
		.replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
		.replace(/\s*[–—]\s*/g, ", ") as T;
}
