import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1, "AUTH_SECRET is required in production")
        : z.string().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_DISCORD_ID: z.string().optional(),
    AUTH_DISCORD_SECRET: z.string().optional(),
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid database URL"),
    DIRECT_URL: z.string().url().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    MIDTRANS_SERVER_KEY: z.string().optional(),
    MIDTRANS_CLIENT_KEY: z.string().optional(),
    MIDTRANS_IS_PRODUCTION: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    BOOKING_UNPAID_GRACE_MINUTES: z.string().optional(),
    SKIP_PRISMA_GENERATE: z.enum(["true", "false"]).optional().default("false"),
    SKIP_DB_MIGRATION: z.enum(["true", "false"]).optional().default("false"),
    SKIP_DB_SEED: z.enum(["true", "false"]).optional().default("false"),
    
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
    MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY,
    MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
    CRON_SECRET: process.env.CRON_SECRET,
    BOOKING_UNPAID_GRACE_MINUTES: process.env.BOOKING_UNPAID_GRACE_MINUTES,
    SKIP_PRISMA_GENERATE: process.env.SKIP_PRISMA_GENERATE,
    SKIP_DB_MIGRATION: process.env.SKIP_DB_MIGRATION,
    SKIP_DB_SEED: process.env.SKIP_DB_SEED,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
