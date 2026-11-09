import "server-only";

import type { TransactionSql } from "postgres";

import { sql } from "@/lib/db";
import { stars as starsFor } from "@/lib/exam";
import { schedule, type Grade } from "@/lib/srs";

// Запись состояния ученика. Устройство создаётся при первой записи.
type Tx = TransactionSql;

async function touchDevice(tx: Tx, device: string) {
  await tx`insert into devices (id) values (${device}) on conflict (id) do update set seen_at = now()`;
}

async function signId(tx: Tx, slug: string) {
  const [row] = await tx<{ id: number }[]>`select id from signs where slug = ${slug}`;
  return row?.id ?? null;
}

/** Возвращает false, если такого жеста нет. */
export async function setFavorite(device: string, slug: string, favorite: boolean) {
  return sql.begin(async (tx) => {
    const id = await signId(tx, slug);
    if (!id) return false;
    await touchDevice(tx, device);
    await tx`insert into sign_state (device_id, sign_id, favorite) values (${device}, ${id}, ${favorite})
      on conflict (device_id, sign_id) do update set favorite = excluded.favorite, updated_at = now()`;
    return true;
  });
}

/** Добавить жест в повторение вручную (из словаря): он сразу появится в «Сегодня стоит повторить». */
export async function addToReview(device: string, slug: string) {
  return sql.begin(async (tx) => {
    const id = await signId(tx, slug);
    if (!id) return false;
    await touchDevice(tx, device);
    await tx`insert into sign_state (device_id, sign_id, due_at) values (${device}, ${id}, now())
      on conflict (device_id, sign_id) do update set due_at = coalesce(sign_state.due_at, now()), updated_at = now()`;
    return true;
  });
}

export async function gradeSign(device: string, slug: string, grade: Grade) {
  return sql.begin(async (tx) => {
    const id = await signId(tx, slug);
    if (!id) return false;
    await touchDevice(tx, device);
    const [prev] = await tx<{ interval_days: number; reps: number }[]>`
      select interval_days, reps from sign_state where device_id = ${device} and sign_id = ${id} for update`;
    const next = schedule({ intervalDays: prev?.interval_days ?? 0, reps: prev?.reps ?? 0 }, grade);
    await tx`insert into sign_state (device_id, sign_id, learned_at, interval_days, reps, due_at)
      values (${device}, ${id}, now(), ${next.intervalDays}, ${next.reps}, ${next.dueAt})
      on conflict (device_id, sign_id) do update set learned_at = coalesce(sign_state.learned_at, now()),
        interval_days = excluded.interval_days, reps = excluded.reps, due_at = excluded.due_at, updated_at = now()`;
    return true;
  });
}

/** Сохраняет шаг урока. На завершении все жесты урока становятся изученными и попадают в повторение. */
export async function saveLessonProgress(device: string, lessonSlug: string, step: number, completed: boolean) {
  return sql.begin(async (tx) => {
    const [lesson] = await tx<{ id: number }[]>`select id from lessons where slug = ${lessonSlug}`;
    if (!lesson) return false;
    await touchDevice(tx, device);
    await tx`insert into lesson_progress (device_id, lesson_id, step, completed_at)
      values (${device}, ${lesson.id}, ${step}, ${completed ? new Date() : null})
      on conflict (device_id, lesson_id) do update set step = excluded.step,
        completed_at = coalesce(excluded.completed_at, lesson_progress.completed_at), updated_at = now()`;
    if (completed) {
      await tx`insert into sign_state (device_id, sign_id, learned_at, due_at)
        select ${device}, ls.sign_id, now(), now() + interval '1 day' from lesson_signs ls where ls.lesson_id = ${lesson.id}
        on conflict (device_id, sign_id) do update set learned_at = coalesce(sign_state.learned_at, now()),
          due_at = coalesce(sign_state.due_at, now() + interval '1 day'), updated_at = now()`;
    }
    return true;
  });
}

/** Итог экзамена (ТЗ, п. 5): ошибки сразу уходят в повторение, верные ответы отмечают жесты изученными.
 *  Детский экзамен и проверка группы букв привязаны к уроку: урок засчитывается, звёзды считает сервер. */
export async function saveExamAttempt(device: string, exam: {
  category?: string; lesson?: string; total: number; correct: number; mistakes: string[]; passed: string[];
}) {
  return sql.begin(async (tx) => {
    const [owner] = exam.lesson
      ? await tx<{ id: number }[]>`select id from lessons where slug = ${exam.lesson}`
      : await tx<{ id: number }[]>`select 1 as id from categories where slug = ${exam.category ?? ""}`;
    if (!owner) return null;
    await touchDevice(tx, device);
    const lessonId = exam.lesson ? owner.id : null;
    const stars = exam.lesson ? starsFor(exam.correct, exam.total) : null;
    await tx`insert into exam_attempts (device_id, category, lesson_id, total, correct, stars, mistakes)
      values (${device}, ${exam.lesson ? null : exam.category!}, ${lessonId}, ${exam.total}, ${exam.correct}, ${stars}, ${exam.mistakes})`;
    await tx`insert into sign_state (device_id, sign_id, learned_at, due_at)
      select ${device}, id, now(), now() + interval '1 day' from signs where slug = any(${exam.passed})
      on conflict (device_id, sign_id) do update set learned_at = coalesce(sign_state.learned_at, now()),
        due_at = coalesce(sign_state.due_at, now() + interval '1 day'), updated_at = now()`;
    await tx`insert into sign_state (device_id, sign_id, due_at)
      select ${device}, id, now() from signs where slug = any(${exam.mistakes})
      on conflict (device_id, sign_id) do update set due_at = now(), updated_at = now()`;
    if (lessonId) {
      await tx`insert into lesson_progress (device_id, lesson_id, step, completed_at) values (${device}, ${lessonId}, 0, now())
        on conflict (device_id, lesson_id) do update set completed_at = coalesce(lesson_progress.completed_at, now()), updated_at = now()`;
    }
    return { stars };
  });
}
