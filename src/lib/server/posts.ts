import { createNotionService } from "$lib/service/notion";

/** Resolve a slug to a Notion page id off the already-cached post list. */
export async function pageIdForSlug(env: App.Platform["env"], slug: string): Promise<string | null> {
  const notion = createNotionService(env);
  const cached = await notion.getBlogs();
  const hit = cached.find(b => b.slug === slug);
  if (hit) {
    return hit.id;
  }

  // Miss: the list may predate a rename, so check once against Notion itself.
  const fresh = await notion.refreshBlogs();
  return fresh.find(b => b.slug === slug)?.id ?? null;
}
