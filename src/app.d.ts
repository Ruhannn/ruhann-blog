// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Platform {
      env: {
        NOTION_TOKEN: string;
        NOTION_BLOG_DATABASE_ID: string;
        REDIS_URL: string;
        PUBLIC_SITE_URL: string;
        ASSETS: Fetcher;
      };
    }
  }
}

export {};
