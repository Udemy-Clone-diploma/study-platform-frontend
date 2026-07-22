export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  courses_count?: number;
  featured_order?: number | null;
};
