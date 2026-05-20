type PriceLikeCourse = {
  pricing_type: string;
  price: string;
};

export function formatPrice(course: PriceLikeCourse) {
  if (course.pricing_type === "free" || Number(course.price) === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(course.price));
}
