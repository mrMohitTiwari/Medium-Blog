import "dotenv/config";
import { defineConfig, env } from "prisma/config"; // Add 'env' here

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // This helper is more reliable for the Prisma CLI
    url: env("DATABASE_URL"), 
  },
});