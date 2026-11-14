/** Junta classes CSS ignorando valores falsos. */
export function cx(...classes: Array<string | number | boolean | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
