import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  // A production build without a real backend URL would ship a site that calls localhost.
  if (command === 'build') {
    const apiUrl = process.env.VITE_API_URL || loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || ''
    if (!/^https?:\/\//.test(apiUrl) || /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(apiUrl)) {
      throw new Error(
        `VITE_API_URL must be the live backend URL for production builds (got "${apiUrl}"). ` +
          'Set it in .env.production or the hosting provider\'s environment variables.',
      )
    }
  }

  return {
    plugins: [react(), tailwindcss()],
  }
})
