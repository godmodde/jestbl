"use client";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** Ref-колбэк для фонового ролика (`preload="none"`, без `autoPlay`): грузится и играет, только когда рядом с окном,
 *  ушёл из вида — пауза. Так главная не запускает десяток роликов разом и первый экран не ждёт в общей очереди.
 *  При «уменьшении движения» — только первый кадр. */
export function playNearby(v: HTMLVideoElement | null) {
  if (!v) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return v.pause();
    if (matchMedia(REDUCED).matches) { v.preload = "metadata"; return; }
    v.play().catch(() => {});
  }, { rootMargin: "400px 0px" });
  io.observe(v);
  return () => io.disconnect();
}
