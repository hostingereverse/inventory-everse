import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: false, // We'll use our own base styles
    }),
  ],
  output: 'server', // Server-side rendering for dynamic content
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});

