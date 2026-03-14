import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: 'public/icons32', dest: '.' },
        { src: 'public/data', dest: '.' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/primevue') ||
            id.includes('node_modules/primeicons') ||
            id.includes('node_modules/@primevue') ||
            id.includes('node_modules/@primeuix')
          ) {
            return 'primevue'
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/vue-chartjs')) {
            return 'chartjs'
          }
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
})
