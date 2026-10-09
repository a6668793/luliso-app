begin;
create extension if not exists pgcrypto;
create table public.pets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 name text not null check(length(name) between 1 and 30), species text not null check(species in ('cat','dog')),
 birthday date, sex text not null check(sex in ('male','female','unknown')), breed text not null default '',
 behavior text not null check(length(behavior) between 10 and 3000), tags text[] not null default '{}', photo_ids uuid[] not null default '{}',
 personality jsonb, created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.media (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 path text not null unique, mime text not null, size integer not null check(size between 1 and 20971520), duration numeric,
 status text not null default 'pending' check(status in ('pending','ready')), created_at timestamptz not null default now()
);
create table public.analyses (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 mode text not null check(mode in ('personality','emotion','sound','heart','coexist')),pet_ids uuid[] not null,
 context text not null, result jsonb not null, created_at timestamptz not null default now()
);
create table public.chat_sessions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 pet_id uuid not null,title text not null,created_at timestamptz not null default now(),unique(id,user_id),
 foreign key(pet_id,user_id) references public.pets(id,user_id) on delete cascade
);
create table public.messages (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 session_id uuid not null,role text not null check(role in ('user','assistant')),content text not null,
 created_at timestamptz not null default now(),foreign key(session_id,user_id) references public.chat_sessions(id,user_id) on delete cascade
);
create table public.daily_usage (
 user_id uuid not null references auth.users on delete cascade,day date not null default ((now() at time zone 'Asia/Taipei')::date),
 count integer not null default 0,primary key(user_id,day)
);
create table public.backups (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,
 source_id uuid not null,drive_file_id text not null,created_at timestamptz not null default now(),unique(user_id,source_id)
);
create table public.preferences (user_id uuid primary key references auth.users on delete cascade,drive_consent boolean not null default false);
create index on public.pets(user_id);create index on public.media(user_id);create index on public.analyses(user_id,created_at desc);
create index on public.chat_sessions(user_id,pet_id);create index on public.messages(session_id,created_at);
do $$ declare t text; begin
 foreach t in array array['pets','media','analyses','chat_sessions','messages','daily_usage','backups','preferences'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop; end $$;
-- All writes go through authenticated server routes, never direct client writes.
create function public.take_ai_quota(p_user uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare n int; begin
 insert into daily_usage(user_id,day,count) values(p_user,(now() at time zone 'Asia/Taipei')::date,1)
 on conflict(user_id,day) do update set count=daily_usage.count+1 where daily_usage.count<10 returning count into n;
 return n is not null;end $$;
revoke all on function public.take_ai_quota(uuid) from public,anon,authenticated;
grant execute on function public.take_ai_quota(uuid) to service_role;
create function public.reserve_media(p_user uuid,p_id uuid,p_path text,p_mime text,p_size integer,p_duration numeric) returns boolean language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if (select coalesce(sum(size),0)+p_size>104857600 or count(*)>=200 from media where user_id=p_user) then return false;end if;
 insert into media(id,user_id,path,mime,size,duration) values(p_id,p_user,p_path,p_mime,p_size,p_duration);return true;
end $$;
revoke all on function public.reserve_media(uuid,uuid,text,text,integer,numeric) from public,anon,authenticated;
grant execute on function public.reserve_media(uuid,uuid,text,text,integer,numeric) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('pet-media','pet-media',false,20971520,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','audio/wav','audio/mpeg','audio/webm','audio/mp4']) on conflict(id) do nothing;
-- Signed upload URLs are created on the server only. No anonymous storage policy.
create policy own_media_read on storage.objects for select to authenticated using(bucket_id='pet-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
