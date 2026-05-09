/** Embedded teacher snapshot returned inside a course detail response. */
export type Teacher = {
  id: number;
  name: string;
  avatar: string | null;
  bio: string;
};
