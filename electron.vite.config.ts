/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// PaperAxis API tokeni depoda tutulmaz; derleme sırasında ortamdan gömülür.
// CI'da PAX_API_TOKEN secret'ından gelir. Tanımsızsa boş gömülür: uygulama sürümü
// yine denetler ama kurulumu indiremez, kullanıcıyı indirme sayfasına yönlendirir.
const apiToken = { __PAX_API_TOKEN__: JSON.stringify(process.env.PAX_API_TOKEN ?? '') }

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: apiToken,
    resolve: {
      alias: { '@shared': resolve('src/shared') }
    },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve('src/shared') }
    },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') }
      }
    }
  }
})
