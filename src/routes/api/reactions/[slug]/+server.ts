import type { RequestHandler } from "./$types";
import { pageIdForSlug } from "$lib/server/posts";
import { readVote, visitorId, writeVote } from "$lib/server/visitor";
import { createNotionService } from "$lib/service/notion";
import { error, json } from "@sveltejs/kit";

const NO_STORE = { "Cache-Control": "no-store" };

export const POST: RequestHandler = async ({ params, platform, request }) => {
  const env = platform!.env;
  const body = await request.json().catch(() => null) as { vote?: unknown } | null;
  const wanted = body?.vote;

  if (wanted !== "like" && wanted !== "dislike" && wanted !== null) {
    throw error(400, "vote must be \"like\", \"dislike\" or null");
  }

  const pageId = await pageIdForSlug(env, params.slug);
  if (!pageId) {
    throw error(404, "Not found");
  }

  const visitor = await visitorId(request, params.slug);
  const previous = await readVote(params.slug, visitor);
  const next = wanted === previous ? null : wanted;

  if (next === previous) {
    const counters = await createNotionService(env).getCounters(pageId);
    return json({ likes: counters.likes, dislikes: counters.dislikes, vote: next }, { headers: NO_STORE });
  }

  const delta = { likes: 0, dislikes: 0 };
  if (previous === "like") {
    delta.likes -= 1;
  }
  if (previous === "dislike") {
    delta.dislikes -= 1;
  }
  if (next === "like") {
    delta.likes += 1;
  }
  if (next === "dislike") {
    delta.dislikes += 1;
  }

  await writeVote(params.slug, visitor, next);
  const counters = await createNotionService(env).bumpCounters(pageId, delta);

  return json(
    { likes: counters.likes, dislikes: counters.dislikes, vote: next },
    { headers: NO_STORE },
  );
};
