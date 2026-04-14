import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const noMockInProd = {
  name: 'no-mock-in-prod',
  buildStart() {
    if (process.env.VITE_USE_MOCK === 'true' && process.env.NODE_ENV === 'production') {
      throw new Error('VITE_USE_MOCK=true is not allowed in production builds. Unset the variable before building.')
    }
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), noMockInProd],
  server: {
    port: 5173,
  },
})
