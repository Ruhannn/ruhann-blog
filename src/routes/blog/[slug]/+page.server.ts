import type { PageServerLoad } from "./$types";
import { createNotionService } from "$lib/service/notion";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
  const env = platform!.env;
  const notion = createNotionService(env);

  let post;
  try {
    post = await notion.getBlogBySlug(params.slug);
  }
  catch (e) {
    console.error("getBlogBySlug failed", params.slug, e);
    throw error(404, "Blog not found");
  }

  const [blogs, counters] = await Promise.all([
    notion.getBlogs(),
    notion.getCounters(post.data.id),
  ]);
  const index = blogs.findIndex(b => b.slug === params.slug);
  const next = index >= 0 ? blogs[index + 1] ?? null : null;

  setHeaders({
    "Cache-Control": "no-store",
  });

  const ogImage = `/og/${params.slug}.png`;

  return { ...post, next, counters, ogImage };
};
