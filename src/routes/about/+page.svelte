<script lang="ts">
  import Head from "$lib/components/Head.svelte";
  import { INFO, SOCIALS } from "$lib/consts";
</script>

<Head
  title="About — {INFO.NAME}s"
  description="{INFO.FULL_NAME} — {INFO.DESCRIPTION}"
  image="/og/default.png"
/>
<!-- TODO -->

<main class="letter">
  <div class="animate" style="--d:40ms">
    <h1>Hello, I'm {INFO.FULL_NAME}.</h1>
    <p class="lead">
      I build things for the web, and I write down the parts that broke on the
      way — which is most of them.
    </p>
  </div>

  <div class="animate" style="--d:120ms">
    <p>
      I live in Dhaka. Most of what I make runs on
      <a class="in" href="/">Svelte and Cloudflare Workers</a>, and most of what
      I think about is the layer underneath: how long a page takes to arrive,
      and how much of it could have been cached.
    </p>
    <p>If something here saved you an afternoon, I'd like to hear about it.</p>
  </div>

  <div class="letter-sign animate" style="--d:200ms">
    {#each SOCIALS as SOCIAL (SOCIAL.NAME)}
      <a target="_blank" rel="noopener noreferrer" href={SOCIAL.HREF}>
        {SOCIAL.NAME}
      </a>
    {/each}
    <a href="/rss.xml">rss</a>
  </div>
</main>
