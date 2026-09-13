<script lang="ts">
  import { page } from "$app/stores";
  import { INFO } from "$lib/consts";
  import ThemeToggle from "./ThemeToggle.svelte";

  $: path = $page.url.pathname;
</script>

<header class="site-nav animate">
  <a class="mark" href="/">{INFO.NAME.toLowerCase()} <span class="p">~</span></a>
  <a href="/" aria-current={path === "/" ? "page" : undefined}>writing</a>
  <a href="/about" aria-current={path === "/about" ? "page" : undefined}>about</a>
  <ThemeToggle />
</header>
