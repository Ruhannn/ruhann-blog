<script lang="ts">
  import { page } from "$app/state";
  import { SITE } from "$lib/consts";
  import "@fontsource/dm-sans/latin-300.css";
  import "@fontsource/dm-sans/latin-400.css";
  import "@fontsource/dm-sans/latin-500.css";
  // import '@fontsource/jetbrains-mono/latin-400.css';

  export let title: string;
  export let description: string;

  $: canonicalURL = page.url.href;
  $: ogImageURL = new URL("/pre.png", page.url).href;
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
  <meta property="og:type" content="website" />
  <meta property="og:url" content={page.url.href} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImageURL} />

  <!-- Twitter (now X) -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={page.url.href} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={ogImageURL} />

  <!-- RSS Link -->
  <link rel="alternate" type="application/rss+xml" title={SITE.NAME} href={rssURL} />
</svelte:head>

<slot />
