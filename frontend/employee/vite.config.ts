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
          // Vendor chunks - stable dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-persist-client', '@tanstack/query-sync-storage-persister'],
          'vendor-ui': ['lucide-react'],
          'vendor-utils': ['axios', 'date-fns'],
          
          // Feature chunks - group related functionality
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
        // Stable chunk naming for better caching and predictable URLs
        chunkFileNames: (chunkInfo) => {
          // Use deterministic names for manual chunks
          if (chunkInfo.isEntry) {
            return `js/[name]-[hash].js`;
          }
          
          // For dynamic imports, use the component name
          const facadeModuleId = chunkInfo.facadeModuleId;
          if (facadeModuleId) {
            const fileName = facadeModuleId.split('/').pop()?.replace(/\.(tsx|ts)$/, '');
            if (fileName) {
              return `js/${fileName}-[hash].js`;
            }
          }
          
          // Fallback for other chunks
          return `js/chunk-[hash].js`;
        },
        // Stable entry file names
        entryFileNames: `js/[name]-[hash].js`,
        // Asset file names
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType ?? '')) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType ?? '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    // Enable source maps for debugging (disable in production)
    sourcemap: process.env.NODE_ENV !== 'production',
    // Optimize asset handling
    assetsInlineLimit: 4096, // 4KB threshold for inlining assets
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn if chunks > 1MB
    // Target modern browsers for better optimization
    target: 'es2020',
  },
  // Development server optimizations
  server: {
    // Enable HMR optimizations
    hmr: {
      overlay: false, // Disable overlay for better UX
    }
  }
})
