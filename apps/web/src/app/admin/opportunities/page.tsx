import { getServerSupabase } from "@/lib/supabase-server";

import { AddOpportunityForm } from "./_components/add-opportunity-form";
import { RowActions } from "./_components/row-actions";

export default async function AdminOpportunities() {
	const supabase = await getServerSupabase();
	const { data: items, error } = await supabase
		.from("opportunities")
		.select(
			"id, title, org, category_id, opportunity_type, location, deadline, license_status, attribution_text, external_url, published_at, created_at",
		)
		.order("license_status", { ascending: true })
		.order("created_at", { ascending: false })
		.limit(200);

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<div className="mb-6">
				<h1 className="mb-2 font-semibold text-2xl">Opportunities</h1>
				<p className="mb-4 text-muted-foreground text-sm">
					Manual upload (OPP-01 / FR-OPP-03). Opportunities are always link-out;
					every row needs <code>attribution_text</code> and an{" "}
					<code>external_url</code> before <code>license_status</code> can flip
					to <code>cleared</code>.
				</p>
				<AddOpportunityForm />
			</div>

			{error ? (
				<p className="text-red-500 text-sm">
					Error loading opportunities: {error.message}
				</p>
			) : items && items.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="text-muted-foreground text-xs uppercase tracking-wider">
							<tr>
								<th className="py-2 pr-3 text-left">Title</th>
								<th className="py-2 pr-3 text-left">Org</th>
								<th className="py-2 pr-3 text-left">Category</th>
								<th className="py-2 pr-3 text-left">Location</th>
								<th className="py-2 pr-3 text-left">Deadline</th>
								<th className="py-2 pr-3 text-left">Status</th>
								<th className="py-2 pr-3 text-left">Published</th>
								<th className="py-2 text-left">Action</th>
							</tr>
						</thead>
						<tbody>
							{items.map((it) => {
								const canClear = !!it.attribution_text && !!it.external_url;
								return (
									<tr key={it.id} className="border-t">
										<td className="max-w-[14rem] py-2 pr-3">
											<span className="line-clamp-2">{it.title}</span>
										</td>
										<td className="py-2 pr-3">{it.org}</td>
										<td className="py-2 pr-3">
											{it.category_id ?? (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="py-2 pr-3">{it.location ?? "—"}</td>
										<td className="py-2 pr-3">{it.deadline ?? "—"}</td>
										<td className="py-2 pr-3">
											<span
												className={
													it.license_status === "cleared"
														? "text-green-600"
														: it.license_status === "blocked"
															? "text-red-500"
															: "text-muted-foreground"
												}
											>
												{it.license_status}
											</span>
										</td>
										<td className="py-2 pr-3">
											{it.published_at
												? new Date(it.published_at).toLocaleDateString()
												: "—"}
										</td>
										<td className="py-2">
											<RowActions
												id={it.id}
												status={it.license_status}
												canClear={canClear}
											/>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			) : (
				<p className="text-muted-foreground text-sm">
					No opportunities yet. Use <strong>Add opportunity</strong> to add the
					first one.
				</p>
			)}
		</div>
	);
}
