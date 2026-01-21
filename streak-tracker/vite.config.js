import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Adds HTTPS support for local dev
  ],
  server: {
    host: true, // Auto-expose to network
    port: 5173
  }
})
