import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // 开发/preview 期把 /api 转发到本机留言板后端（entrance 仓库 server/feedback-api）。
  // X-Site 模拟 nginx 的 proxy_set_header —— 站点归属由代理层决定，后端不解析 Host。
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8792',
        changeOrigin: false,
        headers: { 'X-Site': 'ahb' },
      },
    },
  },
})
