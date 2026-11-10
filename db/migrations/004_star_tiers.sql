-- Детские звёзды ступенями 3 / 5 / 10 вместо 1–3 (сверка с заказчиком 2026-11-10). Старые итоги переводятся по ступеням.
alter table exam_attempts drop constraint if exists exam_attempts_stars_check;
update exam_attempts set stars = case stars when 1 then 3 when 2 then 5 when 3 then 10 end where stars in (1, 2, 3);
alter table exam_attempts add constraint exam_attempts_stars_check check (stars in (3, 5, 10));
