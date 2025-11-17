import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use base path only in production (GitHub Pages), not in development
  base: process.env.NODE_ENV === 'production' ? '/project3-gang_84/' : '/',
})
