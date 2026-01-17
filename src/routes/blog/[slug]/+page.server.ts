import { notion } from "$lib/service/notion";
import { error } from "@sveltejs/kit";

export const load = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;

  if (!slug) {
    throw error(404, "Blog not found");
  }

  try {
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
