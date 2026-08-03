-- The 'throulyscout-avatars' storage bucket existed (created outside migration
-- history during a rebrand from 'avatars' -> 'throuly-avatars' -> 'throulyscout-avatars')
-- but never got an RLS policy, so every upload was denied with "new row
-- violates row-level security policy" for every user. Add an owner-scoped
-- write policy matching the existing pattern used for the original 'avatars'
-- bucket (avatars_owner_write).

DROP POLICY IF EXISTS "throulyscout_avatars_owner_write" ON storage.objects;

CREATE POLICY "throulyscout_avatars_owner_write"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'throulyscout-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (
  bucket_id = 'throulyscout-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) = ANY (ARRAY['png','jpg','jpeg','webp','gif'])
);
