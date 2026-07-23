import { defineConfig } from 'astro/config';

// 배포하면 여기 주소를 내 Vercel 주소로 바꾸면 돼 (안 바꿔도 사이트는 잘 나와)
export default defineConfig({
  site: 'https://my-learning-hub.vercel.app',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
