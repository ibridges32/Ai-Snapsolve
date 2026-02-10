export function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(status: number, message: string) {
  return json(status, { ok: false, error: message });
}
