import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'


export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      // Plugin to replace hardcoded localhost:5000 URLs during build
      {
        name: 'replace-localhost',
        enforce: 'pre',
        transform(code, id) {
          if (id.includes('node_modules')) return null
          if (!id.endsWith('.js') && !id.endsWith('.jsx') && !id.endsWith('.ts') && !id.endsWith('.tsx')) return null
          
          if (mode === 'production') {
            // In production, replace http://localhost:5000 with empty string (same-origin)
            let newCode = code
            // Replace io('http://localhost:5000') -> io(window.location.origin)
            newCode = newCode.replace(/io\(['"]http:\/\/localhost:5000['"]\)/g, 'io(window.location.origin)')
            // Replace fetch('http://localhost:5000/api/...') -> fetch('/api/...')
            newCode = newCode.replace(/['"`]http:\/\/localhost:5000\//g, match => {
              const quote = match[0]
              return quote === '`' ? '`/' : `${quote}/`
            })
            // Replace remaining 'http://localhost:5000' (without path)
            newCode = newCode.replace(/['"]http:\/\/localhost:5000['"]/g, "''")
            
            if (newCode !== code) {
              return { code: newCode, map: null }
            }
          }
          return null
        }
      }
    ],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
          adminLogin: resolve(__dirname, 'admin-login.html'),
          presentation: resolve(__dirname, 'FoodServe_Presentation.html')
        }
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:5000',
          ws: true,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    }
  }
})
