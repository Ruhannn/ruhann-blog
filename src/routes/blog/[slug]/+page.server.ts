import { createNotionService } from "$lib/service/notion";
import { error } from "@sveltejs/kit";

export const load = async ({ params, platform}: { params: { slug: string }; platform: App.Platform }) => {
  const slug = params.slug;
  const env = platform!.env;

  if (!slug) {
    throw error(404, "Blog not found");
  }

  try {
    const notion = createNotionService(env);

    const { data, markdown } = await notion.getBlogBySlug(slug);
    return {
      data,
      markdown,
    };
  }
  catch {
    throw error(500, "Failed to load blog post");
  }
};
