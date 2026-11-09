import "server-only";

import { cookies } from "next/headers";

import { DEVICE_COOKIE, isDeviceId } from "@/lib/device";

/** Устройство текущего посетителя в серверных компонентах (cookie ставит proxy.ts). */
export async function currentDevice() {
  const id = (await cookies()).get(DEVICE_COOKIE)?.value;
  return isDeviceId(id) ? id.toLowerCase() : null;
}
