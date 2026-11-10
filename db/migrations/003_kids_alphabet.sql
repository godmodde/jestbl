-- Детский алфавит (решение заказчика 2026-11-10): группы букв — темы детского мира со станциями
-- «Обведи букву» (trace), «Найди букву» (choose), «Покажи букву» (show — тест камерой или выбором, со звёздами).

alter table topics drop constraint if exists topics_direction_check;
alter table topics add constraint topics_direction_check
  check (direction in ('alphabet', 'adults', 'kids', 'kids-alphabet'));

alter table lessons drop constraint if exists lessons_kind_check;
alter table lessons add constraint lessons_kind_check
  check (kind in ('lesson', 'find', 'pair', 'feed', 'route', 'diff', 'exam', 'trace', 'choose', 'show'));
