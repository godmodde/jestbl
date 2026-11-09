import type { NextRequest } from "next/server";

import { getLearnHome } from "@/lib/data";
import { deviceFromRequest } from "@/lib/device";

export async function GET(req: NextRequest) {
  return Response.json(await getLearnHome(deviceFromRequest(req)));
}
