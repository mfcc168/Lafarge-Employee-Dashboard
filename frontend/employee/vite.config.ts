import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@context': path.resolve(__dirname, './src/context'),
      '@interfaces': path.resolve(__dirname, './src/interfaces'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@configs': path.resolve(__dirname, './src/configs'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages')
    }
  }
})
