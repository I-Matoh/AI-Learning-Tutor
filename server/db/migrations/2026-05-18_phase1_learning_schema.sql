-- Phase 1 learning + usage schema

create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text not null,
  source_course_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null,
  module_order int not null,
  title text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null,
  lesson_order int not null,
  title text not null,
  description text not null,
  content text,
  is_completed boolean not null default false,
  is_locked boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id uuid not null references public.module_lessons(id) on delete cascade,
  status text not null,
  score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id uuid not null references public.module_lessons(id) on delete cascade,
  quiz_payload jsonb not null default '{}'::jsonb,
  score numeric,
  passed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.mastery_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id uuid not null references public.module_lessons(id) on delete cascade,
  score numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,
  event_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_user_updated on public.courses(user_id, updated_at desc);
create index if not exists idx_modules_course_user on public.course_modules(course_id, user_id);
create index if not exists idx_lessons_course_user on public.module_lessons(course_id, user_id);
create index if not exists idx_lesson_attempts_user_created on public.lesson_attempts(user_id, created_at desc);
create index if not exists idx_quiz_attempts_user_created on public.quiz_attempts(user_id, created_at desc);
create index if not exists idx_mastery_user on public.mastery_scores(user_id, updated_at desc);
create index if not exists idx_usage_user_created on public.usage_events(user_id, created_at desc);

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.module_lessons enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.mastery_scores enable row level security;
alter table public.usage_events enable row level security;

create policy if not exists courses_user_access on public.courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists modules_user_access on public.course_modules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists lessons_user_access on public.module_lessons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists lesson_attempts_user_access on public.lesson_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists quiz_attempts_user_access on public.quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists mastery_user_access on public.mastery_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists usage_events_user_access on public.usage_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
