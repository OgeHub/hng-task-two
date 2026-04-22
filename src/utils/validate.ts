export function isValidNameQueryValue(s: string): boolean {
  return /[a-zA-Z]/.test(s) && /^[a-zA-Z\s'\-.]+$/.test(s);
}