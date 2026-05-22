import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: ['./src/server/db/schema.ts', './src/server/db/follow-schema.ts', './src/server/db/themes-schema.ts'],
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
