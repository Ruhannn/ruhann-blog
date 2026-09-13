import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ssr: {
    // workers-og imports two .wasm files, which Vite can't parse. The adapter
    // hands the server build to wrangler, and wrangler resolves wasm natively —
    // so the cleanest fix is to leave this package alone and let wrangler bundle it.
    external: ["workers-og"],
  },
  build: {
    rollupOptions: { external: ["workers-og"] },
  },
});
