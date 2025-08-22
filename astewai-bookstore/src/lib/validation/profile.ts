import { z } from 'zod';

export const readingPreferencesSchema = z.object({
  font_size: z.enum(['small', 'medium', 'large']),
  theme: z.enum(['light', 'dark', 'sepia']),
  reading_speed: z.number().min(100).max(1000),
  notifications_enabled: z.boolean(),
});

export const profileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  avatar_url: z.string().url().optional(),
  reading_preferences: readingPreferencesSchema,
  email_notifications: z.boolean(),
  marketing_emails: z.boolean(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ReadingPreferencesData = z.infer<typeof readingPreferencesSchema>;
