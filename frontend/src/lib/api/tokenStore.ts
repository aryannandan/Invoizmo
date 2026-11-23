/**
 * In-memory Token Store (Blueprint Section 7.2 & 7.3)
 * Access tokens are NEVER stored in localStorage or sessionStorage
 * to completely eliminate XSS token theft vectors.
 */

let accessToken: string | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
  onAuthFailure: (cb: () => void) => {
    onAuthFailureCallback = cb;
  },
  triggerAuthFailure: () => {
    accessToken = null;
    if (onAuthFailureCallback) {
      onAuthFailureCallback();
    }
  },
};
