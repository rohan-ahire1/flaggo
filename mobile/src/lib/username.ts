export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const USERNAME_EMAIL_DOMAIN = "users.flaggo.app";

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value.trim());
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}

export function isSyntheticEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${USERNAME_EMAIL_DOMAIN}`));
}
