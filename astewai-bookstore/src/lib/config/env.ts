import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL'),
  SUPABASE_AUTH_SITE_URL: z.string().url('Invalid auth site URL').optional(),
  
  // Telegram Bot Configuration
  TELEGRAM_BOT_NAME: z.string().min(1, 'Telegram bot name is required'),
  TELEGRAM_BOT_TOKEN: z.string().regex(
    /^\d+:[A-Za-z0-9_-]+$/,
    'Invalid Telegram bot token format'
  ),
  TELEGRAM_ADMIN_CHANNEL_ID: z.string().regex(
    /^-?\d+$/,
    'Invalid Telegram channel ID format'
  ),
  
  // Optional Configuration
  STORE_ANALYTICS_EVENTS: z.enum(['true', 'false']).default('false'),
  SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING: z.string().optional(),
  
  // Email Configuration (optional)
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
  
  // Analytics (optional)
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_API_HOST: z.string().url().optional(),
  
  // SEO (optional)
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  YANDEX_VERIFICATION: z.string().optional(),
  YAHOO_VERIFICATION: z.string().optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment access
export const config = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  site: {
    url: env.NEXT_PUBLIC_SITE_URL,
    authUrl: env.SUPABASE_AUTH_SITE_URL || env.NEXT_PUBLIC_SITE_URL,
  },
  telegram: {
    botName: env.TELEGRAM_BOT_NAME,
    botToken: env.TELEGRAM_BOT_TOKEN,
    adminChannelId: env.TELEGRAM_ADMIN_CHANNEL_ID,
  },
  features: {
    analytics: env.STORE_ANALYTICS_EVENTS === 'true',
  },
  email: {
    resendApiKey: env.RESEND_API_KEY,
    adminEmail: env.ADMIN_EMAIL,
    supportEmail: env.SUPPORT_EMAIL,
  },
  analytics: {
    plausibleDomain: env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    plausibleApiHost: env.NEXT_PUBLIC_PLAUSIBLE_API_HOST,
  },
  seo: {
    googleVerification: env.GOOGLE_SITE_VERIFICATION,
    yandexVerification: env.YANDEX_VERIFICATION,
    yahooVerification: env.YAHOO_VERIFICATION,
  },
} as const;

// Environment type for better TypeScript support
export type Config = typeof config;