import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/qa-module-shoham/',
  server: {
    port: 5174,
  },
  test: {
    environment: 'node',
  },
})
