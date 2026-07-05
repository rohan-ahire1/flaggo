export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value.trim());
}
