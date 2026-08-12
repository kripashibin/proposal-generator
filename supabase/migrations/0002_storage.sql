-- Storage bucket for org logos (and other public-facing proposal assets).
-- Public read (logos must render on the public /p/[token] page); writes are
-- restricted to the authenticated org that owns the path prefix.

insert into storage.buckets (id, name, public)
values ('org-assets', 'org-assets', true)
on conflict (id) do nothing;

-- Path convention: org-assets/{org_id}/logo.<ext>
create policy "org_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'org-assets');

create policy "org_assets_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'org-assets'
    and (storage.foldername(name))[1] = (
      select org_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "org_assets_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'org-assets'
    and (storage.foldername(name))[1] = (
      select org_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "org_assets_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'org-assets'
    and (storage.foldername(name))[1] = (
      select org_id::text from public.profiles where id = auth.uid()
    )
  );
