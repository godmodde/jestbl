import { NextResponse, type NextRequest } from "next/server";

import { DEVICE_COOKIE, isDeviceId } from "@/lib/device";

// Выдаёт анонимный id устройства при первом визите и сразу кладёт его в запрос,
// чтобы страница уже на первом показе знала устройство.
export function proxy(request: NextRequest) {
  if (isDeviceId(request.cookies.get(DEVICE_COOKIE)?.value)) return NextResponse.next();
  const id = crypto.randomUUID();
  request.cookies.set(DEVICE_COOKIE, id);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(DEVICE_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
