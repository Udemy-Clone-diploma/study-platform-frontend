export type ReviewAuthor = {
  id: number;
  name: string;
  avatar: string | null;
  /**
   * Author's professional role/headline, shown under their name on review cards.
   * Optional: the backend Review serializer does not return it yet (see BACKEND_TASKS.md).
   */
  role?: string | null;
};

export type CourseReview = {
  id: number;
  student: ReviewAuthor;
  rating: number;
  text: string;
  created_at: string;
};

/** Cross-course review returned by the platform-wide "top reviews" endpoint (e.g. the homepage). */
export type TopReview = CourseReview & {
  course: { slug: string; title: string };
};
