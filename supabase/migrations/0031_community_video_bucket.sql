-- Supabase Storage bucket for user-uploaded community post videos.
-- Videos are stored at community-videos/{user_id}/{filename} so RLS can
-- enforce per-user ownership via the first path segment.
--
-- Max 100 MB per file. Only video MIME types accepted.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'community-videos',
    'community-videos',
    true,
    104857600,
    array['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'video/3gpp']
)
on conflict (id) do nothing;

-- Public read (bucket is public but explicit policy is belt-and-suspenders)
create policy "community_videos_select"
    on storage.objects for select
    using (bucket_id = 'community-videos');

-- Authenticated users may upload only under their own user_id prefix
create policy "community_videos_insert"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'community-videos'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users may delete their own uploads
create policy "community_videos_delete"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'community-videos'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
