-- Контент: темы, уроки, категории и единая карточка жеста (ТЗ, п. 20).
create table topics (
  id serial primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  position int not null,
  status text not null check (status in ('open', 'soon'))
);

create table categories (
  slug text primary key,
  title text not null,
  position int not null
);

create table signs (
  id serial primary key,
  slug text not null unique,
  title text not null,
  gloss text not null,
  meaning text not null,
  how_to text,
  context text,
  notice text,
  category text not null references categories (slug),
  video_url text,
  source_url text,
  needs_review boolean not null default true,
  search text generated always as (lower(title || ' ' || gloss || ' ' || meaning)) stored
);

create table sign_similar (
  sign_id int not null references signs on delete cascade,
  similar_id int not null references signs on delete cascade,
  note text not null,
  primary key (sign_id, similar_id)
);

create table lessons (
  id serial primary key,
  slug text not null unique,
  topic_id int not null references topics on delete cascade,
  title text not null,
  summary text not null,
  position int not null
);

create table lesson_signs (
  lesson_id int not null references lessons on delete cascade,
  sign_id int not null references signs on delete cascade,
  position int not null,
  primary key (lesson_id, sign_id)
);

-- Состояние ученика. Входа нет: человек = анонимное устройство из cookie.
create table devices (
  id uuid primary key,
  created_at timestamptz not null default now(),
  seen_at timestamptz not null default now()
);

create table sign_state (
  device_id uuid not null references devices on delete cascade,
  sign_id int not null references signs on delete cascade,
  favorite boolean not null default false,
  learned_at timestamptz,
  interval_days real not null default 0,
  due_at timestamptz,
  reps int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (device_id, sign_id)
);
create index sign_state_due on sign_state (device_id, due_at);

create table lesson_progress (
  device_id uuid not null references devices on delete cascade,
  lesson_id int not null references lessons on delete cascade,
  step int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (device_id, lesson_id)
);
