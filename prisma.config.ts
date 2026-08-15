import { defineConfig, sqliteDb } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  databases: {
    db: {
      provider: 'sqlite',
      url: 'file:./dev.db',
    },
  },
  // Prisma 7 requires datasource for db push/migrate
  datasource: {
    url: 'file:./dev.db',
  },
})
