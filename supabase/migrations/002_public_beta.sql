begin;
-- Public beta shares a conservative global budget across all visitor sessions.
create table if not exists public.public_beta_budget(day date primary key, count integer not null default 0);
alter table public.public_beta_budget enable row level security;
revoke all on public.public_beta_budget from anon,authenticated;
grant all on public.public_beta_budget to service_role;
create or replace function public.take_public_ai_quota(p_user uuid) returns boolean
language plpgsql security definer set search_path=public as $$
declare d date := (now() at time zone 'Asia/Taipei')::date;
begin
 perform pg_advisory_xact_lock(hashtextextended('luliso-public-ai-' || d::text,0));
 if (select count from public_beta_budget where day=d)>=30 then return false; end if;
 if not take_ai_quota(p_user) then return false; end if;
 insert into public_beta_budget(day,count) values(d,1) on conflict(day) do update set count=public_beta_budget.count+1;
 return true;
end $$;
revoke all on function public.take_public_ai_quota(uuid) from public,anon,authenticated;
grant execute on function public.take_public_ai_quota(uuid) to service_role;
commit;
