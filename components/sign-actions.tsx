"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/ui";
import { send } from "@/lib/client-api";

// «В избранное» и «В повторение» (ТЗ, п. 18). Меняем сразу, при ошибке откатываем и говорим об этом.
export function SignActions({ slug, favorite: initialFavorite, inReview: initialInReview }: { slug: string; favorite: boolean; inReview: boolean }) {
  // Своё состояние — только последнее нажатие; остальное из данных сервера. Тогда шаг урока, открытый заново
  // до ответа сервера, догонит свежие данные после router.refresh(), а не застрянет на старых.
  const [favoriteOverride, setFavorite] = useState<boolean | null>(null);
  const [inReviewOverride, setInReview] = useState<boolean | null>(null);
  const favorite = favoriteOverride ?? initialFavorite;
  const inReview = inReviewOverride ?? initialInReview;
  const [error, setError] = useState("");
  const router = useRouter();

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    setError("");
    if (!(await send(`/signs/${slug}/favorite`, "PUT", { favorite: next }))) {
      setFavorite(!next);
      setError("Не удалось сохранить. Попробуйте ещё раз.");
    } else router.refresh();
  }

  async function addToReview() {
    setInReview(true);
    setError("");
    if (!(await send(`/signs/${slug}/review`, "POST", {}))) {
      setInReview(false);
      setError("Не удалось добавить в повторение. Попробуйте ещё раз.");
    } else router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={favorite} onClick={toggleFavorite}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-ink px-4 font-semibold transition-colors hover:bg-ink hover:text-paper aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-white">
          <Icon name={favorite ? "star-fill" : "star"} />
          {favorite ? "В избранном" : "В избранное"}
        </button>
        <button type="button" onClick={addToReview} disabled={inReview}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-ink px-4 font-semibold transition-colors enabled:hover:bg-ink enabled:hover:text-paper disabled:border-line disabled:text-muted">
          <Icon name={inReview ? "check" : "repeat"} />
          {inReview ? "В повторении" : "В повторение"}
        </button>
      </div>
      <p className="m-0 min-h-5 text-sm text-ink-2" role="status">{error}</p>
    </div>
  );
}
