import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminContent() {
	const supabase = await getServerSupabase();
	const { data: items, error } = await supabase
		.from("content_items")
		.select(
			"id, kind, title, focus_area_id, license_type, license_status, published_at, created_at",
		)
		// Drafts first so anything needing clearance is impossible to miss.
		.order("license_status", { ascending: true })
		.order("created_at", { ascending: false })
		.limit(100);

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<h1 className="mb-2 font-semibold text-2xl">Curated content</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				Manual curation (FR-FEED-04). Hybrid licensing per DEC-06: every
				item declares link-out, cloudinary-hosted, original, or unknown;
				only <code>cleared</code> items are visible to clients via RLS.
				Add / edit / publish flows will live here.
			</p>

			{error ? (
				<p className="text-red-500 text-sm">
					Error loading content: {error.message}
				</p>
			) : items && items.length > 0 ? (
				<table className="w-full text-sm">
					<thead className="text-muted-foreground text-xs uppercase tracking-wider">
						<tr>
							<th className="py-2 text-left">Title</th>
							<th className="py-2 text-left">Kind</th>
							<th className="py-2 text-left">Focus</th>
							<th className="py-2 text-left">License</th>
							<th className="py-2 text-left">Status</th>
							<th className="py-2 text-left">Published</th>
						</tr>
					</thead>
					<tbody>
						{items.map((it) => (
							<tr key={it.id} className="border-t">
								<td className="py-2">{it.title}</td>
								<td className="py-2">{it.kind}</td>
								<td className="py-2">{it.focus_area_id ?? "—"}</td>
								<td className="py-2">{it.license_type ?? "—"}</td>
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
					No content items yet. (CRUD flows are M1 work.)
				</p>
			)}
		</div>
	);
}
