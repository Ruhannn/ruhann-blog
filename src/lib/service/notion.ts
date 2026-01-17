import type { Blog } from "$lib/types";
import { NOTION_BLOG_DATABASE_ID, NOTION_TOKEN, REDIS_URL } from "$env/static/private";
import { markdownToHtml } from "$lib/utils/markdownToHtml";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { createClient } from "redis";

interface CachedBlogPost {
  data: Blog;
  markdown: string;
}

export default class NotionService {
  client: Client;
  n2m: NotionToMarkdown;
  databaseId: string;
  private redis: ReturnType<typeof createClient>;
  private readonly BLOGS_CACHE_KEY = "notion:blogs:all";
  private readonly BLOG_CACHE_PREFIX = "notion:blog:";
  private readonly BLOGS_TTL = 300;
  private readonly BLOG_TTL = 3600;

  constructor() {
    this.databaseId = NOTION_BLOG_DATABASE_ID;
    this.client = new Client({ auth: NOTION_TOKEN });
    this.n2m = new NotionToMarkdown({ notionClient: this.client });
    this.redis = createClient({
      url: REDIS_URL,
    });
    this.redis.connect()
  }

  async getBlogs(): Promise<Blog[]> {
    return this.withCache(
      this.BLOGS_CACHE_KEY,
      this.BLOGS_TTL,
      async () => {
        const response = await this.client.dataSources.query({
          data_source_id: this.databaseId,
          filter_properties: ["Name", "Created", "words", "Slug", "Description"],
          filter: {
            property: "Published",
            checkbox: { equals: true },
          },
          result_type: "page",
          sorts: [{ property: "Updated", direction: "descending" }],
        });
        return response.results.map(NotionService.pageToBlogTransformer);
      },
    );
  }

  async getBlogBySlug(slug: string): Promise<CachedBlogPost> {
    return this.withCache(
      `${this.BLOG_CACHE_PREFIX}${slug}`,
      this.BLOG_TTL,
      async () => {
        const response = await this.client.dataSources.query({
          data_source_id: this.databaseId,
          filter_properties: ["Name", "Created", "words", "Slug", "Description"],
          filter: {
            property: "Slug",
            formula: { string: { equals: slug } },
          },
        });

        const page = response.results[0];
        const mdBlocks = await this.n2m.pageToMarkdown(page.id);
        const markdown = await markdownToHtml(
          this.n2m.toMarkdownString(mdBlocks).parent,
        );
        const data = NotionService.pageToBlogTransformer(page);

        return { data, markdown };
      },
    );
  }

  async invalidateCache(slug?: string): Promise<void> {
    const keys = slug
      ? [`${this.BLOG_CACHE_PREFIX}${slug}`, this.BLOGS_CACHE_KEY]
      : [this.BLOGS_CACHE_KEY];

    await this.deleteKeys(keys);
  }

  async clearAllCache(): Promise<void> {
    const keys = await this.redis.keys("notion:*");
    if (keys.length > 0) {
      await this.deleteKeys(keys);
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  private async withCache<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetcher();

    await this.redis.setEx(key, ttl, JSON.stringify(data));

    return data;
  }

  private async deleteKeys(keys: string[]): Promise<void> {
    await this.redis.del(keys);
  }

  private static pageToBlogTransformer(page: any): Blog {
    return {
      id: page.id,
      cover:
        page?.cover?.type === "external"
          ? page.cover.external.url
          : page?.cover?.type === "file"
            ? page.cover.file.url
            : null,
      title: page.properties.Name.title[0].plain_text,
      description: page.properties.Description.rich_text[0].plain_text,
      createdAt: page.created_time,
      lastUpdateAt: page.last_edited_time,
      slug: page.properties.Slug.formula.string,
      readTime: `${Math.ceil(page.properties.words.number / 200 + 1)} mins read`,
    };
  }
}

export const notion = new NotionService();
