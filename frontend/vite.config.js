import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  // VITE_API_URL is baked into the build and is also the origin uploaded images (/uploads/...) are
  // loaded from. A production build pointing at localhost would ship broken API calls and images.
  if (command === 'build') {
    const apiUrl = process.env.VITE_API_URL || loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || ''
    if (!/^https?:\/\//.test(apiUrl) || /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(apiUrl)) {
      throw new Error(
        `VITE_API_URL must be the live backend URL for production builds (got "${apiUrl}"). ` +
          'Set it in frontend/.env.production or in your hosting provider\'s environment variables.',
      )
    }
  }

  return {
    plugins: [react(), tailwindcss()],
  }
})
