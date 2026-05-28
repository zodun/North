import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminOpportunities() {
	const supabase = await getServerSupabase();
	const { data: items, error } = await supabase
		.from("opportunities")
		.select(
			"id, title, org, opportunity_type, location, deadline, license_status, published_at, created_at",
		)
		.order("license_status", { ascending: true })
		.order("created_at", { ascending: false })
		.limit(100);

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<h1 className="mb-2 font-semibold text-2xl">Opportunities</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				Manual upload (DEC-03: opportunity upload before scraping).
				Opportunities are always link-out; every row needs attribution
				and an external URL before <code>license_status</code> can flip
				to <code>cleared</code>.
			</p>

			{error ? (
				<p className="text-red-500 text-sm">
					Error loading opportunities: {error.message}
				</p>
			) : items && items.length > 0 ? (
				<table className="w-full text-sm">
					<thead className="text-muted-foreground text-xs uppercase tracking-wider">
						<tr>
							<th className="py-2 text-left">Title</th>
							<th className="py-2 text-left">Org</th>
							<th className="py-2 text-left">Type</th>
							<th className="py-2 text-left">Location</th>
							<th className="py-2 text-left">Deadline</th>
							<th className="py-2 text-left">Status</th>
							<th className="py-2 text-left">Published</th>
						</tr>
					</thead>
					<tbody>
						{items.map((it) => (
							<tr key={it.id} className="border-t">
								<td className="py-2">{it.title}</td>
								<td className="py-2">{it.org}</td>
								<td className="py-2">{it.opportunity_type ?? "—"}</td>
								<td className="py-2">{it.location ?? "—"}</td>
								<td className="py-2">{it.deadline ?? "—"}</td>
								<td className="py-2">{it.license_status}</td>
								<td className="py-2">
									{it.published_at
										? new Date(it.published_at).toLocaleDateString()
										: "—"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			) : (
				<p className="text-muted-foreground text-sm">
					No opportunities yet. (CRUD flows are M1 work.)
				</p>
			)}
		</div>
	);
}
