/** Linear px-per-viewport-width ramp that hits pxA at vwA and pxB at vwB. */
export function ramp(vwA: number, pxA: number, vwB: number, pxB: number): string {
  const slope = (pxB - pxA) / (vwB - vwA);
  const intercept = pxA - slope * vwA;
  return `calc(${intercept.toFixed(3)}px + ${(slope * 100).toFixed(4)}vw)`;
}

/**
 * Three-point fluid scale: hits px1 at vw1, px2 at vw2, px3 at vw3 (flat
 * outside that range). Lets phone, tablet, and desktop each land on their own
 * approved size instead of sharing one flat mobile+tablet floor.
 */
export function fluid3(
  vw1: number,
  px1: number,
  vw2: number,
  px2: number,
  vw3: number,
  px3: number,
): string {
  const rampA = `clamp(${px1}px, ${ramp(vw1, px1, vw2, px2)}, ${px2}px)`;
  const rampB = `clamp(${px2}px, ${ramp(vw2, px2, vw3, px3)}, ${px3}px)`;
  return `calc(${rampA} + ${rampB} - ${px2}px)`;
}
