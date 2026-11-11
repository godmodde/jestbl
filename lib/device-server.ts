import "server-only";

import { cookies } from "next/headers";

import { AGE_COOKIE, DEVICE_COOKIE, isDeviceId, type KidsAge } from "@/lib/device";
import { parseVariant, VARIANT_COOKIE, type Variant } from "@/lib/variant";

/** Устройство текущего посетителя в серверных компонентах (cookie ставит proxy.ts). */
export async function currentDevice() {
  const id = (await cookies()).get(DEVICE_COOKIE)?.value;
  return isDeviceId(id) ? id.toLowerCase() : null;
}

/** Возраст в детском мире, если уже выбран на этом устройстве. */
/** Вариант макета (кнопка «Варианты»): по умолчанию — исходник. */
export async function currentVariant(): Promise<Variant> {
  return parseVariant((await cookies()).get(VARIANT_COOKIE)?.value);
}

export async function currentAge(): Promise<KidsAge | null> {
  const age = (await cookies()).get(AGE_COOKIE)?.value;
  return age === "small" || age === "big" ? age : null;
}
