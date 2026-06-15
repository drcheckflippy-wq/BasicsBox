import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',  // Allows all ngrok-free.app subdomains
      '168c-139-167-56-242.ngrok-free.app'  // Your specific URL
    ],
    host: true  // Listen on all addresses
  }
})
