import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// PRD §10.4: base 自适应 —— 部署到 GitHub Pages 时传 DEPLOY_TARGET=pages
// PRD §10.7: 把 mp3 加入 assetsInclude，确保 Vite 以 URL 引用处理（不内联 base64）
export default defineConfig({
  plugins: [vue()],
  base: process.env.DEPLOY_TARGET === 'pages' ? '/xiaochou-pai-b2/' : './',
  assetsInclude: ['**/*.mp3'],
  build: {
    // 强制 mp3 文件输出为独立 asset 文件（不内联为 base64）
    assetsInlineLimit: (filePath) => {
      if (filePath.endsWith('.mp3')) return false
      return 4096 // 其他资源保持默认 4KB 阈值
    },
  },
})
