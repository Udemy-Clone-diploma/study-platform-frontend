import type { CoverCrop, CoverCropSlot, CoverCrops } from "./types";

/** Aspect ratio (width/height) each slot actually renders at. Order here is
 * also the order the crop editor shows them in. */
export const COVER_CROP_SLOTS: { id: CoverCropSlot; aspect: number }[] = [
  { id: "card", aspect: 46 / 52 },
  { id: "row", aspect: 4 / 3 },
  { id: "banner", aspect: 16 / 9 },
];

const DEFAULT_CROP: CoverCrop = { x: 0, y: 0, width: 100, height: 100 };

export const DEFAULT_COVER_CROPS: CoverCrops = {
  card: { ...DEFAULT_CROP },
  row: { ...DEFAULT_CROP },
  banner: { ...DEFAULT_CROP },
};
