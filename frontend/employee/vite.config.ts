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
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  build: {
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-persist-client', '@tanstack/query-sync-storage-persister'],
          'vendor-ui': ['lucide-react'],
          'vendor-utils': ['axios', 'date-fns'],
          
          // Feature chunks
          'auth': ['./src/context/AuthContext.tsx', './src/components/RequireAuth.tsx'],
          'forms': [
            './src/components/AutoCompleteInput.tsx',
            './src/components/VacationRequestForm.tsx'
          ],
          'reports': [
            './src/components/ReportEntryForm.tsx',
            './src/components/ReportEntryList.tsx',
            './src/hooks/useReportEntryForm.tsx'
          ],
          'dashboard': [
            './src/components/WeeklySamplesSummary.tsx',
            './src/components/WeeklyNewClientOrder.tsx'
          ]
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Enable source maps for debugging (disable in production)
    sourcemap: process.env.NODE_ENV !== 'production',
    // Optimize asset handling
    assetsInlineLimit: 4096, // 4KB threshold for inlining assets
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn if chunks > 1MB
  },
  // Development server optimizations
  server: {
    // Enable HMR optimizations
    hmr: {
      overlay: false, // Disable overlay for better UX
    }
  }
})
