<script lang="ts">
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>{$page.status} — not found</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="letter">
  <div class="animate" style="--d:40ms">
    <h1>{$page.status === 404 ? "No such page." : "Something broke."}</h1>
    <p class="lead">
      {$page.status === 404
        ? "That link is wrong, or the post was renamed and the old address stopped working."
        : $page.error?.message ?? "An unexpected error occurred."}
    </p>
  </div>

  <div class="letter-sign animate" style="--d:140ms">
    <a href="/">all posts</a>
    <a href="/about">about</a>
    <a href="/rss.xml">rss</a>
  </div>
</main>
