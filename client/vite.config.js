import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true, // Don't try other ports if 3000 is in use
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Increase chunk size warning limit for large dependencies
    chunkSizeWarningLimit: 1000,
    
    // Advanced minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true
    },
    
    // Advanced code splitting and chunk optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI library chunks
          'ui-vendor': [
            'reactstrap', 
            'bootstrap',
            '@fortawesome/fontawesome-free'
          ],
          
          // Chart and visualization libraries
          'charts-vendor': [
            'chart.js', 
            'react-chartjs-2', 
            '@react-jvectormap/core', 
            '@react-jvectormap/world'
          ],
          
          // Form and utility libraries
          'forms-vendor': [
            'react-hook-form',
            'joi', 
            'react-datepicker',
            'react-select',
            'react-dual-listbox'
          ],
          
          // Editor and rich text libraries
          'editor-vendor': [
            'quill',
            'react-quilljs', 
            '@tinymce/tinymce-react',
            'tinymce'
          ],
          
          // Calendar and date libraries
          'calendar-vendor': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/list',
            '@fullcalendar/bootstrap5'
          ],
          
          // DnD and interaction libraries
          'dnd-vendor': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/modifiers',
            'react-dropzone',
            'react-slick',
            'slick-carousel'
          ],
          
          // Utility libraries
          'utils-vendor': [
            'classnames',
            'highlight.js',
            'html-react-parser',
            'export-from-json',
            'react-copy-to-clipboard',
            'simplebar-react'
          ]
        },
        
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            extType = 'media';
          } else if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
            extType = 'images';
          } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            extType = 'fonts';
          }
          return `${extType}/[name]-[hash][extname]`;
        }
      }
    },
    
    // Enable source maps for debugging in production
    sourcemap: false,
    
    // Optimize build performance
    target: 'esnext',
    
    // Enable asset inlining for small files
    assetsInlineLimit: 4096
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'reactstrap',
      'bootstrap'
    ],
    exclude: [
      // Exclude large libraries from pre-bundling to allow for better chunking
      'chart.js',
      'tinymce',
      '@fullcalendar/core'
    ]
  }
})
