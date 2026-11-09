"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/** Подложка `.slide-mark` (возвращаемый ref) встаёт под выбранный пункт (`selector`) внутри `root` и переезжает к новому при смене `key`.
 *  Стиль пишется напрямую, без состояния React. Пункты — `position: relative`, чтобы быть над подложкой; `root` — их offsetParent. */
export function useSlideMark<T extends HTMLElement>(root: RefObject<HTMLElement | null>, selector: string, key: unknown) {
  const mark = useRef<T>(null);
  useLayoutEffect(() => {
    const box = root.current, m = mark.current;
    if (!box || !m) return;
    const place = () => {
      const el = box.querySelector<HTMLElement>(selector);
      if (!el) { m.style.opacity = "0"; return; }
      // Из скрытого состояния — встать на место без проезда, только проявиться.
      const hidden = m.style.opacity !== "1";
      if (hidden) m.style.transition = "opacity .2s";
      m.style.translate = `${el.offsetLeft}px ${el.offsetTop}px`;
      m.style.width = `${el.offsetWidth}px`;
      m.style.height = `${el.offsetHeight}px`;
      m.style.opacity = "1";
      if (hidden) { void m.offsetWidth; m.style.transition = ""; }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, [root, selector, key]);
  return mark;
}
