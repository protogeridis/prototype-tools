import { cookies } from 'next/headers';

import { decodeDevSettings, DEV_SETTINGS_COOKIE } from './devSettings';

// The dev settings for server components and the root layout, from the cookie the preview keeps
// in step. Reading cookies makes a route render per request rather than at build time.
export async function getDevSettings() {
  const store = await cookies();
  return decodeDevSettings(store.get(DEV_SETTINGS_COOKIE)?.value);
}
