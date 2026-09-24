import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://melonchicken.github.io',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false }]],
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false }]],
    }),
  ],
});
