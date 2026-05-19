import pages from '@hono/vite-cloudflare-pages'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    pages({ entry: './src/index.ts' }),
    {
      name: 'inject-worker-polyfills',
      generateBundle(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            chunk.code = `if(typeof globalThis.MessageChannel==="undefined"){globalThis.MessageChannel=class{port1;port2;constructor(){this.port1={onmessage:null,postMessage(){}};this.port2={onmessage:null,postMessage(){}}}}};\n${chunk.code}`
          }
        }
      },
    },
    {
      name: 'fix-routes-json',
      writeBundle() {
        const routesPath = resolve(__dirname, 'dist/_routes.json')
        if (existsSync(routesPath)) {
          const routes = JSON.parse(readFileSync(routesPath, 'utf-8'))
          routes.exclude = ['/client/*', '/fonts/*', '/styles/*', '/favicon.ico']
          writeFileSync(routesPath, JSON.stringify(routes, null, 2))
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    emptyOutDir: false,
  },
  test: {
    environment: 'happy-dom',
  },
})
