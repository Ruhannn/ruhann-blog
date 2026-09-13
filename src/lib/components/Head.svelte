<script lang="ts">
  import { page } from "$app/state";
  import { SITE } from "$lib/consts";

  export let title: string;
  export let description: string;
  /** Absolute or root-relative image for social cards. */
  export let image: string | null = null;
  export let type: "website" | "article" = "website";

  $: canonicalURL = page.url.href;
  $: ogImageURL = image ? new URL(image, page.url).href : null;
  $: rssURL = new URL("rss.xml", page.url.origin).href;
</script>

<svelte:head>
  <!-- Canonical URL -->
  <link rel="canonical" href={canonicalURL} />

  <!-- Primary Meta Tags -->
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={page.url.href} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {#if ogImageURL}
    <meta property="og:image" content={ogImageURL} />
  {/if}

  <!-- Twitter (now X) -->
  <meta property="twitter:card" content={ogImageURL ? "summary_large_image" : "summary"} />
  <meta property="twitter:url" content={page.url.href} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  {#if ogImageURL}
    <meta property="twitter:image" content={ogImageURL} />
  {/if}

  <!-- RSS Link -->
  <link rel="alternate" type="application/rss+xml" title={SITE.NAME} href={rssURL} />
</svelte:head>

<slot />
