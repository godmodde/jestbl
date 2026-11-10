// Входа нет: ученик — это анонимное устройство. Веб получает id в cookie (её ставит proxy.ts),
// будущее приложение передаёт тот же id заголовком X-Device-Id.
export const DEVICE_COOKIE = "vidno_device";
export const DEVICE_HEADER = "x-device-id";

/** Возраст в детском мире (сверка с заказчиком 2026-11-10): малыши 3–5 и дети 6–12; выбирается при первом входе. */
export const AGE_COOKIE = "vidno_age";
export type KidsAge = "small" | "big";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isDeviceId = (value: string | null | undefined): value is string => !!value && UUID.test(value);

export function deviceFromRequest(req: Request & { cookies?: { get(name: string): { value: string } | undefined } }) {
  const id = req.headers.get(DEVICE_HEADER) ?? req.cookies?.get(DEVICE_COOKIE)?.value;
  return isDeviceId(id) ? id.toLowerCase() : null;
}
