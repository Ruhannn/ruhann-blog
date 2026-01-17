<script lang="ts">
  import type { PageData } from "./$types";
  import Layout from "../../+layout.svelte";

  export let data: PageData;
</script>

<Layout title={data.data.title} description={data.data.description}>
  <div class="mx-auto max-w-4xl p-5">
    <article class="animate prose prose-lg dark:prose-invert max-w-none">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html data.markdown}
    </article>
  </div>
</Layout>
