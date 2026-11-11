-- LifeTracker: videos in the Album.
--
-- Additive only: a new private bucket, `lt-videos`, for the Album's video memories, with the same
-- members-only policies as `photos`. Curio Cabinet's `photos` bucket (images only, 15 MB) is left
-- exactly as it is. The rows themselves are the Album's existing lt_records (kind album_shot), so no
-- table changes. 50 MiB per file is the Free plan's upload limit.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lt-videos', 'lt-videos', false, 52428800,
        array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "members can read lt videos" on storage.objects for select to authenticated
  using (bucket_id = 'lt-videos' and (select public.is_member()));
create policy "members can upload lt videos" on storage.objects for insert to authenticated
  with check (bucket_id = 'lt-videos' and (select public.is_member()));
create policy "members can update lt videos" on storage.objects for update to authenticated
  using (bucket_id = 'lt-videos' and (select public.is_member()));
create policy "members can delete lt videos" on storage.objects for delete to authenticated
  using (bucket_id = 'lt-videos' and (select public.is_member()));
