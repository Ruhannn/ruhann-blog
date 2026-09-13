/**
 * A visitor id with no cookie and no stored personal data: the IP and
 * user-agent are hashed together and only the digest is ever kept.
 */
export async function visitorId(request: Request, scope: string): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? "0.0.0.0";
  const ua = request.headers.get("user-agent") ?? "";
  const bytes = new TextEncoder().encode(`${ip}|${ua}|${scope}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

type Vote = "like" | "dislike" | null;

/**
 * Vote records live in the Cloudflare edge cache. That makes them per-datacenter
 * and evictable — deliberately: it stops casual double-voting without needing a
 * database, and the worst failure is someone eventually being able to vote again.
 */
function voteRequest(slug: string, visitor: string) {
  return new Request(`https://reactions.cache/${encodeURIComponent(slug)}/${visitor}`);
}

function cache(): Cache | undefined {
  return (globalThis as any).caches?.default;
}

export async function readVote(slug: string, visitor: string): Promise<Vote> {
  const c = cache();
  if (!c) {
    return null;
  }
  const hit = await c.match(voteRequest(slug, visitor));
  if (!hit) {
    return null;
  }
  const value = await hit.text();
  return value === "like" || value === "dislike" ? value : null;
}

export async function writeVote(slug: string, visitor: string, vote: Vote): Promise<void> {
  const c = cache();
  if (!c) {
    return;
  }
  const req = voteRequest(slug, visitor);
  if (vote === null) {
    await c.delete(req);
    return;
  }
  await c.put(req, new Response(vote, {
    headers: { "Cache-Control": "max-age=31536000" },
  }));
}

/** True the first time this visitor is seen for the key today. */
export async function firstVisitToday(key: string): Promise<boolean> {
  const c = cache();
  if (!c) {
    return true;
  }
  const day = new Date().toISOString().slice(0, 10);
  const req = new Request(`https://views.cache/${day}/${key}`);
  if (await c.match(req)) {
    return false;
  }
  await c.put(req, new Response("1", {
    headers: { "Cache-Control": "max-age=86400" },
  }));
  return true;
}
