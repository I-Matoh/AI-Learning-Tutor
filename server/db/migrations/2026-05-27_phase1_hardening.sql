-- Phase 1 hardening: atomic quota and relational progress sync keys

create table if not exists public.usage_daily_counters (
  user_id uuid not null,
  usage_date date not null default (now() at time zone 'utc')::date,
  used_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists idx_usage_daily_counters_user_date
  on public.usage_daily_counters(user_id, usage_date desc);

alter table public.usage_daily_counters enable row level security;

create policy if not exists usage_daily_counters_user_access
  on public.usage_daily_counters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.course_modules add column if not exists source_module_id text;
alter table public.module_lessons add column if not exists source_lesson_id text;

create unique index if not exists uq_course_modules_source
  on public.course_modules(course_id, source_module_id)
  where source_module_id is not null;

create unique index if not exists uq_module_lessons_source
  on public.module_lessons(course_id, source_lesson_id)
  where source_lesson_id is not null;

create or replace function public.consume_generation_quota(
  p_user_id uuid,
  p_daily_limit int,
  p_event_type text,
  p_event_meta jsonb default '{}'::jsonb
)
returns table(granted boolean, daily_used int, resets_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_used int := 0;
begin
  insert into public.usage_daily_counters(user_id, usage_date, used_count, updated_at)
  values (p_user_id, v_today, 0, now())
  on conflict (user_id, usage_date) do nothing;

  update public.usage_daily_counters
  set used_count = used_count + 1,
      updated_at = now()
  where user_id = p_user_id
    and usage_date = v_today
    and used_count < p_daily_limit
  returning used_count into v_used;

  if found then
    insert into public.usage_events(user_id, event_type, event_meta, created_at)
    values (p_user_id, p_event_type, coalesce(p_event_meta, '{}'::jsonb), now());

    return query select true, v_used, ((v_today + interval '1 day')::timestamp at time zone 'utc');
    return;
  end if;

  select used_count into v_used
  from public.usage_daily_counters
  where user_id = p_user_id and usage_date = v_today;

  return query select false, coalesce(v_used, 0), ((v_today + interval '1 day')::timestamp at time zone 'utc');
end;
$$;

create or replace function public.release_generation_quota(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  update public.usage_daily_counters
  set used_count = greatest(used_count - 1, 0),
      updated_at = now()
  where user_id = p_user_id and usage_date = v_today;

  insert into public.usage_events(user_id, event_type, event_meta, created_at)
  values (p_user_id, 'quota_release', '{"reason":"generation_failed"}'::jsonb, now());
end;
$$;
