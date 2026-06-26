/** Copy of `xs` sorted ascending by `order` (copies first, never mutates the source). */
export function byOrder<T extends { order: number }>(xs: readonly T[]): T[] {
  return [...xs].sort((a, b) => a.order - b.order);
}
