import type { RequestHandler } from "./$types";
import { createNotionService } from "$lib/service/notion";

export const GET: RequestHandler = async ({ platform, setHeaders, url }) => {
  const env = platform!.env;
  const site = env.PUBLIC_SITE_URL || url.origin;

  const blogs = await createNotionService(env).getBlogs();

  const urls = [
    { loc: site, changefreq: "daily", priority: "1.0", lastmod: null as string | null },
    { loc: `${site}/about`, changefreq: "monthly", priority: "0.5", lastmod: null },
    ...blogs.map(b => ({
      loc: `${site}/blog/${b.slug}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: new Date(b.lastUpdateAt).toISOString(),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
  .join("\n")}
</urlset>`;

  setHeaders({
    "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  });

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
