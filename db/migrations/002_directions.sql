-- Новое ТЗ (2026-10-10): три направления на одной базе жестов, один жест во многих категориях, экзамены (ТЗ, п. 5–6).

alter table topics add column direction text not null default 'adults'
  check (direction in ('alphabet', 'adults', 'kids'));

-- Урок взрослых и группа букв — 'lesson'; в детской теме уроки — станции маршрута со своей механикой.
alter table lessons add column kind text not null default 'lesson'
  check (kind in ('lesson', 'find', 'pair', 'feed', 'route', 'diff', 'exam'));

-- Тип материала, уровень, теги, картинка предмета для детских игр, дополнительные ракурсы [{label, url}].
-- sort_key: «ё» сортируется как «е», как в словарях.
alter table signs
  add column kind text not null default 'other'
    check (kind in ('object', 'action', 'interaction', 'phrase', 'letter', 'other')),
  add column level smallint check (level between 1 and 3),
  add column tags text[] not null default '{}',
  add column picture text,
  add column angles jsonb not null default '[]',
  add column sort_key text generated always as (replace(lower(title), 'ё', 'е')) stored;

-- signs.category остаётся основной категорией (подпись в карточке) и тоже входит в связи.
create table sign_categories (
  sign_id int not null references signs on delete cascade,
  category text not null references categories on update cascade on delete cascade,
  primary key (sign_id, category)
);
create index sign_categories_category on sign_categories (category);
insert into sign_categories select id, category from signs;

-- Похожие (легко спутать) и связанные (встречаются вместе) жесты.
alter table sign_similar add column kind text not null default 'similar' check (kind in ('similar', 'related'));

-- Экзамен взрослых — по категории, детский экзамен и проверка группы букв — по уроку.
create table exam_attempts (
  id bigserial primary key,
  device_id uuid not null references devices on delete cascade,
  category text references categories on delete cascade,
  lesson_id int references lessons on delete cascade,
  total int not null check (total > 0),
  correct int not null check (correct between 0 and total),
  stars smallint check (stars between 1 and 3),
  mistakes text[] not null default '{}',
  created_at timestamptz not null default now(),
  check ((category is null) <> (lesson_id is null))
);
create index exam_attempts_device on exam_attempts (device_id, created_at desc);
