<script lang="ts">
  import type { PageData } from "./$types";
  import BlogCard from "$lib/components/BlogCard.svelte";
  import { HOME } from "$lib/consts";

  export let data: PageData;
</script>

<svelte:head>
  <title>{HOME.TITLE}</title>
  <meta name="description" content={HOME.DESCRIPTION} />
</svelte:head>

<div class="min-h-screen p-4 animate">
  <h1 class="text-3xl text-center my-7">My Blogs</h1>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each data.blogs as blog}
      <BlogCard {blog} />
    {/each}
  </div>
</div>

