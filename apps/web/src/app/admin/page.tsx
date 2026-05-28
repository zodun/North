import Link from "next/link";

import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminHome() {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const { data: isAdmin } = await supabase.rpc("is_admin");

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<h1 className="mb-2 font-semibold text-2xl">Admin</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				Signed in as {user?.email ?? "unknown"}.{" "}
				{isAdmin
					? "You can publish content and opportunities."
					: "Your account is not in the admins allow-list yet; writes will be rejected by RLS."}
			</p>
			<ul className="space-y-2">
				<li>
					<Link href="/admin/content" className="underline underline-offset-4">
						Curated content
					</Link>{" "}
					<span className="text-muted-foreground">— FR-FEED-04</span>
				</li>
				<li>
					<Link
						href="/admin/opportunities"
						className="underline underline-offset-4"
					>
						Opportunities
					</Link>{" "}
					<span className="text-muted-foreground">
						— Manual upload (DEC-03)
					</span>
				</li>
			</ul>
		</div>
	);
}
