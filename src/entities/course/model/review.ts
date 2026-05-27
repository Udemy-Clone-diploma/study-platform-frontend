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
