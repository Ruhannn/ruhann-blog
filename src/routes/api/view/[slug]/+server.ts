import type { RequestHandler } from "./$types";
import { pageIdForSlug } from "$lib/server/posts";
import { firstVisitToday, visitorId } from "$lib/server/visitor";
import { createNotionService } from "$lib/service/notion";

export const POST: RequestHandler = async ({ params, platform, request }) => {
  const env = platform!.env;
  const visitor = await visitorId(request, "view");

  const work = (async () => {
    if (!(await firstVisitToday(`${params.slug}/${visitor}`))) {
      return;
    }
    const pageId = await pageIdForSlug(env, params.slug);
    if (!pageId) {
      return;
    }
    await createNotionService(env).bumpCounters(pageId, { views: 1 });
  })().catch((e) => {
    console.error("view ping failed", params.slug, e);
  });

  platform?.context?.waitUntil?.(work);

  return new Response(null, { status: 202, headers: { "Cache-Control": "no-store" } });
};
