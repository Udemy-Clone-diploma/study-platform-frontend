import type { CSSProperties } from "react";
import type { CoverCrop } from "../model/types";

/** `object-fit: cover` + the position/zoom that reproduces a CoverCrop box exactly.
 * Spread onto the `style` of a `fill`-sized `next/image` inside an `overflow-hidden`
 * box whose aspect ratio matches the crop's slot (card/row/banner).
 *
 * `object-position: X%` places X% of the image's *overflow* (scaled size minus
 * container size) off-screen -- not "X% of the way across the image" -- so it's
 * derived from the crop box's edges rather than used directly. */
export function coverCropStyle(crop: CoverCrop): CSSProperties {
  const width = Math.min(100, crop.width);
  const height = Math.min(100, crop.height);
  const xPos = width < 100 ? (crop.x / (100 - width)) * 100 : 50;
  const yPos = height < 100 ? (crop.y / (100 - height)) * 100 : 50;
  const position = `${xPos}% ${yPos}%`;
  // Whichever of width/height is larger is the axis a plain cover fit already
  // matches exactly; scaling in by 100/that reproduces this crop's zoom.
  const zoom = 100 / Math.max(width, height);

  return {
    objectFit: "cover",
    objectPosition: position,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: position,
  };
}
