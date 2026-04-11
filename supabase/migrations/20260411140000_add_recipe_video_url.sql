-- Optional recipe video link (YouTube, Drive, Vimeo, direct file URL, etc.)

alter table public.recipes
  add column if not exists video_url text null;

comment on column public.recipes.video_url is 'Optional public URL for a recipe video (embed when supported).';
