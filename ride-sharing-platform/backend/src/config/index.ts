import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env - try multiple locations to handle different run contexts
dotenv.config(); // Try cwd first (root when running pnpm dev from root)
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') }); // Try backend subfolder
dotenv.config({ path: path.join(process.cwd(), '..', '.env') }); // Try parent folder

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Twilio (SOS)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Mapbox
  MAPBOX_ACCESS_TOKEN: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
  },
  database: {
    url: env.DATABASE_URL,
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },
  mapbox: {
    accessToken: env.MAPBOX_ACCESS_TOKEN,
  },
  redis: {
    url: env.REDIS_URL,
  },
  // App configuration
  app: {
    clusterRadiusKm: 1,
    maxDetourMinutes: 15,
    defaultPickupWindowMinutes: 30,
    maxPickupWindowHours: 4,
    minMatchScore: 60,
    locationUpdateIntervalMs: 5000,
    routeDeviationThresholdMeters: 200,
  },
} as const;
