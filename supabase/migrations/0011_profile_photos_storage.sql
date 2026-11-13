-- Photos de profil choisies volontairement; lecture par URL publique, écriture limitée au dossier Auth du propriétaire.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tecap-profile-photos',
  'tecap-profile-photos',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

drop policy if exists tecap_profile_photos_insert_own on storage.objects;
create policy tecap_profile_photos_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'tecap-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists tecap_profile_photos_update_own on storage.objects;
create policy tecap_profile_photos_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'tecap-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'tecap-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists tecap_profile_photos_delete_own on storage.objects;
create policy tecap_profile_photos_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'tecap-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
