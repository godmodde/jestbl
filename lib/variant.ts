// Варианты макета для согласования (заказчик 2026-11-10): 1 — исходник, 2 и 3 — предложения по референсам Леры.
// Без зелёного, оранжевого и ядовитых цветов; детям — плюш и 3D, взрослым — строже.
// ponytail: переключатель — инструмент согласования; после выбора оставить один вариант и убрать остальные.

export const VARIANT_COOKIE = "vidno_variant";
export type Variant = 1 | 2 | 3;

export const VARIANTS: { v: Variant; title: string; note: string }[] = [
  { v: 1, title: "Исходник", note: "Сайт как сейчас" },
  { v: 2, title: "Цвет", note: "Синий акцент, детям — яркие объёмные кнопки и буквы" },
  { v: 3, title: "Плюш", note: "Сливовый акцент, детям — пушистые кнопки, рамки и буквы" },
];

export const parseVariant = (raw?: string | null): Variant => (raw === "2" ? 2 : raw === "3" ? 3 : 1);

/** Новые детские игры (варианты 2 и 3) — на станциях прежних механик с тем же навыком:
 *  прогресс, наклейки и звёзды работают без изменений базы. */
export const NEW_GAMES: Record<string, { kind: string; title: string }> = {
  find: { kind: "balloons", title: "Лопни шарики" },
  pair: { kind: "memory", title: "Мемори" },
  feed: { kind: "room", title: "Найди в комнате" },
  route: { kind: "story", title: "История с другом" },
};

export const gameFor = (kind: string, title: string, v: Variant) => (v === 1 ? null : NEW_GAMES[kind]) ?? { kind, title };
