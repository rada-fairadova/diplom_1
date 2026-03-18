import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/diplom_1/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})