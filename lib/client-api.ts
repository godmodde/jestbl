// Вызовы /api/v1 из браузера. Устройство передаётся cookie, которую ставит proxy.ts.
export async function send(path: string, method: "PUT" | "POST", body: unknown): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.ok;
  } catch {
    return false;
  }
}
