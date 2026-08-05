import { getAccessToken, setAccessToken } from "@/lib/authToken";
import { login } from "../api/authApi";

/**
 * Stands in for a login screen until one exists. Deliberately reads
 * VITE_DEV_LOGIN_* directly from import.meta.env here, inside the
 * `import.meta.env.DEV` branch, rather than exposing them on the shared
 * `env` object in `config/env.ts` — that object's fields are evaluated
 * unconditionally at module load, so a literal dev password living there
 * would survive into a production bundle regardless of whether this
 * function ever runs. Reading it directly means the same dead-code
 * elimination that strips this whole branch in a prod build also strips
 * the embedded credential string.
 *
 * TODO(auth): replace with a real login screen before this ships to a real
 * user — this path is dev-only and silently inert outside `import.meta.env.DEV`.
 */
export async function devAutoLogin(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (getAccessToken()) return;

  const email = import.meta.env.VITE_DEV_LOGIN_EMAIL as string | undefined;
  const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD as string | undefined;
  if (!email || !password) {
    throw new Error(
      "VITE_DEV_LOGIN_EMAIL / VITE_DEV_LOGIN_PASSWORD are not set — see frontend/.env.example",
    );
  }

  const { data } = await login({ email, password });
  setAccessToken(data.accessToken);
}
