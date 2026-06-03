import { env } from "@north/env/web";
import Image from "next/image";

import { getServerSupabase } from "@/lib/supabase-server";

import { AddLinkOutForm } from "./_components/add-link-out-form";
import { RowActions } from "./_components/row-actions";
import { ContentUploadWidget } from "./_components/upload-widget";

export default async function AdminContent() {
	const supabase = await getServerSupabase();
	const { data: items, error } = await supabase
		.from("content_items")
		.select(
			"id, kind, title, content_category_id, focus_area_id, license_type, license_status, attribution_text, external_url, cloudinary_public_id, published_at, created_at",
		)
		// Drafts first so anything needing clearance is impossible to miss.
		.order("license_status", { ascending: true })
		.order("created_at", { ascending: false })
		.limit(200);

	const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			<div className="mb-6">
				<h1 className="mb-2 font-semibold text-2xl">Curated content</h1>
				<p className="mb-4 text-muted-foreground text-sm">
					Manual curation (FR-FEED-04). Every item must have{" "}
					<code>attribution_text</code> and a URL or media asset before it can
					be cleared. Only <code>cleared</code> items are visible to clients via
					RLS.
				</p>

				<div className="flex flex-wrap gap-3">
					<AddLinkOutForm />
					{cloudName ? (
						<ContentUploadWidget cloudName={cloudName} />
					) : (
						<p className="max-w-[14rem] self-center text-muted-foreground text-xs">
							Set <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> to enable
							hosted uploads.
						</p>
					)}
				</div>
			</div>

			{error ? (
				<p className="text-red-500 text-sm">
					Error loading content: {error.message}
				</p>
			) : items && items.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="text-muted-foreground text-xs uppercase tracking-wider">
							<tr>
								<th className="py-2 pr-3 text-left">Preview</th>
								<th className="py-2 pr-3 text-left">Title</th>
								<th className="py-2 pr-3 text-left">Kind</th>
								<th className="py-2 pr-3 text-left">Category</th>
								<th className="py-2 pr-3 text-left">License</th>
								<th className="py-2 pr-3 text-left">Status</th>
								<th className="py-2 pr-3 text-left">Published</th>
								<th className="py-2 text-left">Action</th>
							</tr>
						</thead>
						<tbody>
							{items.map((it) => {
								const canClear =
									!!it.attribution_text &&
									(!!it.external_url || !!it.cloudinary_public_id);
								return (
									<tr key={it.id} className="border-t">
										<td className="py-2 pr-3">
											{it.cloudinary_public_id && cloudName ? (
												<Image
													src={`https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_56,h_56,q_auto,f_auto/${it.cloudinary_public_id}`}
													alt=""
													width={56}
													height={56}
													className="rounded object-cover"
													unoptimized
												/>
											) : it.external_url ? (
												<a
													href={it.external_url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-muted-foreground text-xs underline underline-offset-2"
												>
													Link ↗
												</a>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="max-w-[16rem] py-2 pr-3">
											<span className="line-clamp-2">{it.title}</span>
										</td>
										<td className="py-2 pr-3">{it.kind}</td>
										<td className="py-2 pr-3">
											{it.content_category_id ?? (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="py-2 pr-3">{it.license_type ?? "—"}</td>
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
					No content items yet. Use <strong>Add link-out item</strong> to add an
					article or resource, or <strong>Upload hosted media</strong> to stage
					a Cloudinary asset.
				</p>
			)}
		</div>
	);
}
