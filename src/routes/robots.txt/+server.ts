import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ platform, url, setHeaders }) => {
  const site = platform?.env?.PUBLIC_SITE_URL || url.origin;

  setHeaders({ "Cache-Control": "public, max-age=0, s-maxage=86400" });

  return new Response(
    `# allow crawling everything by default\nUser-agent: *\nDisallow:\n\nSitemap: ${site}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
