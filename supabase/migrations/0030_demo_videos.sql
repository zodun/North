-- Demo self-hosted video items for development.
-- Uses free public-domain MP4s so videos play natively without YouTube restrictions.
-- Replace external_url values with Cloudinary URLs once users upload their own content.
--
-- license_type='link-out' because the MP4s live on Google's CDN (not Cloudinary).
-- attribution_text is required by the cleared_requires_attribution constraint.

insert into public.content_items (
    id, kind, title, eyebrow, body, source, attribution_text,
    external_url, cloudinary_public_id, thumbnail_url,
    content_category_id, published_at, sort_order,
    license_status, license_type, created_at
)
values
    (gen_random_uuid(), 'video', 'Big dreams start with one step', 'MOTIVATION', null, 'North', 'Sample video (Google Developers)',
     'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', null,
     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=720&q=80',
     null, now(), 1, 'cleared', 'link-out', now()),

    (gen_random_uuid(), 'video', 'Every escape begins with courage', 'INSPIRATION', null, 'North', 'Sample video (Google Developers)',
     'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', null,
     'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=720&q=80',
     null, now(), 2, 'cleared', 'link-out', now()),

    (gen_random_uuid(), 'video', 'Joy is a practice, not a destination', 'WELLBEING', null, 'North', 'Sample video (Google Developers)',
     'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', null,
     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=720&q=80',
     null, now(), 3, 'cleared', 'link-out', now()),

    (gen_random_uuid(), 'video', 'Joyrides are better with company', 'COMMUNITY', null, 'North', 'Sample video (Google Developers)',
     'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', null,
     'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=720&q=80',
     null, now(), 4, 'cleared', 'link-out', now()),

    (gen_random_uuid(), 'video', 'Melts: find what moves you', 'DISCOVERY', null, 'North', 'Sample video (Google Developers)',
     'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', null,
     'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=720&q=80',
     null, now(), 5, 'cleared', 'link-out', now())

on conflict do nothing;
