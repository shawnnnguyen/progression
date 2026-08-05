let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

let inFlightRefresh: Promise<string> | null = null;

/**
 * Coordinates concurrent 401s onto a single refresh call. authService rotates
 * the refresh token on every use, so if each concurrent request called
 * refresh() independently, only the first would succeed and the rest would
 * fail against an already-rotated token — incorrectly bouncing a valid
 * session to "sign in required" purely from request concurrency.
 */
export function getOrStartRefresh(startRefresh: () => Promise<string>): Promise<string> {
  if (!inFlightRefresh) {
    inFlightRefresh = startRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}
