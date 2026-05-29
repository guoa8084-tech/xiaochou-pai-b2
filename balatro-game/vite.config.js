import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// PRD §10.4: base 自适应 —— 部署到 GitHub Pages 时传 DEPLOY_TARGET=pages
export default defineConfig({
  plugins: [vue()],
  base: process.env.DEPLOY_TARGET === 'pages' ? '/balatro-game/' : './',
})
