/* Public Supabase config.
 *
 * These two values are not secrets. They ship inside the JavaScript bundle
 * of every Supabase browser app — anyone who loads the site can read them.
 * Row Level Security is the thing that protects the data: every row is
 * scoped to auth.uid(), so this key on its own reads nothing.
 *
 * Committing them means a deploy needs no environment configuration.
 * Setting VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY still overrides them,
 * which is what you'd use to point a dev build at a scratch project.
 */
export const DEFAULT_SUPABASE_URL = "https://xfjthqmzhfrioywjzuln.supabase.co";
export const DEFAULT_SUPABASE_KEY = "sb_publishable_2Sk9mMKu5zAL1W9ne-DSJw_wFASxNJ8";
