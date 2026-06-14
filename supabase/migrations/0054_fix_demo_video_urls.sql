-- Google locked down the gtv-videos-bucket sample MP4s seeded in 0030 (they now
-- return 403 AccessDenied), so those demo video items fail to play and the
-- browser shows a raw GCS XML error. Repoint them at live, public-domain open
-- movies (Blender Foundation, Sintel + Big Buck Bunny, CC BY).
--
-- Keyed on the old URL, so this is idempotent and also repairs the rows after a
-- `supabase db reset` (it runs after 0030's insert). These remain demo content;
-- replace with real Cloudinary uploads once available.

update public.content_items
set external_url = 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    attribution_text = 'Sample video (Blender Foundation, CC BY)'
where external_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

update public.content_items
set external_url = 'https://media.w3.org/2010/05/bunny/movie.mp4',
    attribution_text = 'Sample video (Blender Foundation, CC BY)'
where external_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';

update public.content_items
set external_url = 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    attribution_text = 'Sample video (Blender Foundation, CC BY)'
where external_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';

update public.content_items
set external_url = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    attribution_text = 'Sample video (Blender Foundation, CC BY)'
where external_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';

update public.content_items
set external_url = 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
    attribution_text = 'Sample video (Blender Foundation, CC BY)'
where external_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4';
