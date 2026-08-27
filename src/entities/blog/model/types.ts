export type ArticleStatus = "draft" | "review" | "rejected" | "published" | "archived";

export type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  headline: string;
  description: string;
  order: number;
  /** Only present when the list endpoint annotates it (see BlogCategoryService.annotate_articles_count) --
   * absent on categories embedded in article payloads. */
  articles_count?: number;
};

export type ArticleAuthor = {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
};

/** Every distinct aspect ratio the cover image actually renders at across the
 * frontend -- each needs its own crop since a framing centered for a tall
 * card can clip the subject entirely in a wide banner. Keep in sync with
 * `COVER_CROP_SLOTS` (config.ts) and the backend's `Article.COVER_CROP_SLOTS`. */
export type CoverCropSlot = "card" | "row" | "banner";

/** The crop box itself, in percentages (0-100) of the image's own width/height:
 * x/y are the box's top-left corner, width/height are the box's size. This is
 * exactly the shape react-easy-crop's `onCropComplete` reports and its
 * `initialCroppedAreaPercentages` prop accepts, so nothing here has to be
 * re-derived from a center point + zoom (a former representation whose
 * conversion formula was only exactly correct for a crop centered at 50/50). */
export type CoverCrop = { x: number; y: number; width: number; height: number };

export type CoverCrops = Record<CoverCropSlot, CoverCrop>;

export type ArticleListItem = {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  cover_image: string | null;
  cover_crops: CoverCrops;
  category: BlogCategory | null;
  author: ArticleAuthor;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  is_assigned_to_me: boolean;
};

export type ArticleDetail = ArticleListItem & {
  body_html: string;
  moderator_comment: string;
};

/** Permanent record of a reject/approve decision, independent of the live article's
 * current status (which keeps changing after the decision -- edited, resubmitted,
 * archived, withdrawn). See ArticleModerationSnapshot on the backend. */
export type ArticleModerationSnapshot = {
  id: number;
  article_id: number;
  article_slug: string;
  article_status: ArticleStatus;
  decision: "rejected" | "published";
  comment: string;
  title: string;
  subtitle: string;
  cover_image: string | null;
  cover_crops: CoverCrops;
  author_name: string;
  moderator_name: string | null;
  created_at: string;
};
