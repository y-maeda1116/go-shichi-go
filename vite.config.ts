import pages from '@hono/vite-cloudflare-pages'
import { defineConfig } from 'vite'
import { resolve } from 'path'

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
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
  },
})
