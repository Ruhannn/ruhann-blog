<script lang="ts">
  export let label: string;
  export let href: string = `/?tag=${encodeURIComponent(label)}`;
  export let active = false;
  export let noscroll = false;
</script>

<a class="chip" class:on={active} {href} data-sveltekit-noscroll={noscroll ? "" : undefined}>
  {label}
</a>
