import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  vite: {
    ssr: {
      external: ['@prisma/client'],
    },
  },
})
