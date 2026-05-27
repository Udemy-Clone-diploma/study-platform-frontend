import type {
  CourseDeliveryType,
  CourseLanguage,
  CourseLevel,
  CourseMode,
  CourseType,
  PricingPlan,
} from "@/entities/course";

export type CatalogSearchParams = {
  [key: string]: string | string[] | undefined;
};

export type CatalogFilterState = {
  category?: string;
  course_type?: string;
  delivery_type?: string;
  filtersOpen: boolean;
  is_on_sale?: boolean;
  language?: string;
  level?: string;
  mode?: string;
  /** Comma-separated PricingPlan kinds (e.g. "group,individual"). */
  plan_kind?: string;
  /** Decimal-string lower bound on the cheapest plan price. Empty means unbounded. */
  price_min?: string;
  /** Decimal-string upper bound on the cheapest plan price. Empty means unbounded. */
  price_max?: string;
  rating_min?: string;
  search?: string;
  with_certificate?: boolean;
};

export type CatalogFilterOption = {
  label: string;
  param: keyof CatalogFilterState;
  value: string;
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const LANGUAGE_LABELS: Record<CourseLanguage, string> = {
  english: "English",
  ukrainian: "Ukrainian",
  spanish: "Spanish",
};

export const MODE_LABELS: Record<CourseMode, string> = {
  self_learning: "Self-study",
  with_teacher: "Study with a teacher",
};

export const DELIVERY_LABELS: Record<CourseDeliveryType, string> = {
  self_paced: "Self-paced",
  scheduled: "Scheduled",
  individual: "Individually",
  group: "In the group",
};

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  profession: "Profession",
  qualification: "Advanced training",
  knowledge: "Expanding knowledge",
};

export const PLAN_KIND_LABELS: Record<PricingPlan["kind"], string> = {
  group: "Group plan",
  individual: "Individual coaching",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCatalogState(params: CatalogSearchParams): CatalogFilterState {
  return {
    category: firstParam(params.category),
    course_type: firstParam(params.course_type),
    delivery_type: firstParam(params.delivery_type),
    filtersOpen: firstParam(params.filters) === "open",
    is_on_sale: firstParam(params.is_on_sale) === "true" ? true : undefined,
    language: firstParam(params.language),
    level: firstParam(params.level),
    mode: firstParam(params.mode),
    plan_kind: firstParam(params.plan_kind),
    price_min: firstParam(params.price_min),
    price_max: firstParam(params.price_max),
    rating_min: firstParam(params.rating_min),
    search: firstParam(params.search)?.trim(),
    with_certificate: firstParam(params.with_certificate) === "true" ? true : undefined,
  };
}

export function getCatalogValues(state: CatalogFilterState, param: keyof CatalogFilterState) {
  const value = state[param];

  if (typeof value !== "string") {
    return [];
  }

  return value.split(",").filter(Boolean);
}

export function isCatalogOptionChecked(
  state: CatalogFilterState,
  option: CatalogFilterOption,
) {
  return getCatalogValues(state, option.param).includes(option.value);
}

export function buildCatalogHref(
  state: CatalogFilterState,
  updates: Partial<CatalogFilterState> & { toggle?: CatalogFilterOption },
) {
  const next: CatalogFilterState = { ...state, ...updates };

  if (updates.toggle) {
    const values = new Set(getCatalogValues(state, updates.toggle.param));

    if (values.has(updates.toggle.value)) {
      values.delete(updates.toggle.value);
    } else {
      values.add(updates.toggle.value);
    }

    const nextValue = Array.from(values).join(",");
    (next as Record<string, unknown>)[updates.toggle.param] = nextValue || undefined;
  }

  const params = new URLSearchParams();

  if (next.category) params.set("category", next.category);
  if (next.course_type) params.set("course_type", next.course_type);
  if (next.delivery_type) params.set("delivery_type", next.delivery_type);
  if (next.filtersOpen) params.set("filters", "open");
  if (next.is_on_sale) params.set("is_on_sale", "true");
  if (next.language) params.set("language", next.language);
  if (next.level) params.set("level", next.level);
  if (next.mode) params.set("mode", next.mode);
  if (next.plan_kind) params.set("plan_kind", next.plan_kind);
  if (next.price_min) params.set("price_min", next.price_min);
  if (next.price_max) params.set("price_max", next.price_max);
  if (next.rating_min) params.set("rating_min", next.rating_min);
  if (next.search) params.set("search", next.search);
  if (next.with_certificate) params.set("with_certificate", "true");

  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

export function resetCatalogFiltersHref(state: CatalogFilterState) {
  return buildCatalogHref(state, {
    category: undefined,
    course_type: undefined,
    delivery_type: undefined,
    is_on_sale: undefined,
    language: undefined,
    level: undefined,
    mode: undefined,
    plan_kind: undefined,
    price_min: undefined,
    price_max: undefined,
    rating_min: undefined,
    with_certificate: undefined,
  });
}
