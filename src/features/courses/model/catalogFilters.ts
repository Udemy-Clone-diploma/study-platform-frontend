import type {
  CourseLanguage,
  CourseLevel,
  CourseType,
  DeliveryFormatType,
} from "@/entities/course";

export type CatalogSearchParams = {
  [key: string]: string | string[] | undefined;
};

export type CatalogFilterState = {
  category?: string;
  course_type?: string;
  filtersOpen: boolean;
  is_on_sale?: boolean;
  language?: string;
  level?: string;
  /** Comma-separated delivery format types (e.g. "group,individual"). */
  format_type?: string;
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

/** Translator scoped to the "CatalogEnums" message namespace. */
type EnumTranslator = (key: string) => string;

export function getLevelLabels(t: EnumTranslator): Record<CourseLevel, string> {
  return {
    beginner: t("level.beginner"),
    intermediate: t("level.intermediate"),
    advanced: t("level.advanced"),
  };
}

export function getLanguageLabels(t: EnumTranslator): Record<CourseLanguage, string> {
  return {
    english: t("language.english"),
    ukrainian: t("language.ukrainian"),
    spanish: t("language.spanish"),
  };
}

export function getCourseTypeLabels(t: EnumTranslator): Record<CourseType, string> {
  return {
    profession: t("courseType.profession"),
    qualification: t("courseType.qualification"),
    knowledge: t("courseType.knowledge"),
  };
}

export function getFormatTypeLabels(t: EnumTranslator): Record<DeliveryFormatType, string> {
  return {
    self_paced: t("formatType.self_paced"),
    scheduled: t("formatType.scheduled"),
    individual: t("formatType.individual"),
    group: t("formatType.group"),
  };
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCatalogState(params: CatalogSearchParams): CatalogFilterState {
  return {
    category: firstParam(params.category),
    course_type: firstParam(params.course_type),
    filtersOpen: firstParam(params.filters) === "open",
    is_on_sale: firstParam(params.is_on_sale) === "true" ? true : undefined,
    language: firstParam(params.language),
    level: firstParam(params.level),
    format_type: firstParam(params.format_type),
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

/** Whether every value in a group (e.g. the two format types under "Self-study") is selected. */
export function isCatalogGroupChecked(
  state: CatalogFilterState,
  param: keyof CatalogFilterState,
  groupValues: string[],
) {
  const current = getCatalogValues(state, param);
  return groupValues.every((value) => current.includes(value));
}

/** Toggles a whole group of values for one param together: selects all when any are missing, clears all when fully selected. */
export function buildCatalogGroupHref(
  state: CatalogFilterState,
  param: keyof CatalogFilterState,
  groupValues: string[],
) {
  const current = new Set(getCatalogValues(state, param));
  const allSelected = groupValues.every((value) => current.has(value));

  for (const value of groupValues) {
    if (allSelected) {
      current.delete(value);
    } else {
      current.add(value);
    }
  }

  const nextValue = Array.from(current).join(",");
  return buildCatalogHref(state, {
    [param]: nextValue || undefined,
    filtersOpen: true,
  } as Partial<CatalogFilterState>);
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
  if (next.filtersOpen) params.set("filters", "open");
  if (next.is_on_sale) params.set("is_on_sale", "true");
  if (next.language) params.set("language", next.language);
  if (next.level) params.set("level", next.level);
  if (next.format_type) params.set("format_type", next.format_type);
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
    is_on_sale: undefined,
    language: undefined,
    level: undefined,
    format_type: undefined,
    price_min: undefined,
    price_max: undefined,
    rating_min: undefined,
    with_certificate: undefined,
  });
}
