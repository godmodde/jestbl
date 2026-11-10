import "server-only";

import { cookies } from "next/headers";

import { AGE_COOKIE, DEVICE_COOKIE, isDeviceId, type KidsAge } from "@/lib/device";

/** Устройство текущего посетителя в серверных компонентах (cookie ставит proxy.ts). */
export async function currentDevice() {
  const id = (await cookies()).get(DEVICE_COOKIE)?.value;
  return isDeviceId(id) ? id.toLowerCase() : null;
}

/** Возраст в детском мире, если уже выбран на этом устройстве. */
export async function currentAge(): Promise<KidsAge | null> {
  const age = (await cookies()).get(AGE_COOKIE)?.value;
  return age === "small" || age === "big" ? age : null;
}
