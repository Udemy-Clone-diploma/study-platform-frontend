import { getTranslations } from "next-intl/server";
import type { Category } from "@/entities/course";
import {
  buildCatalogGroupHref,
  buildCatalogHref,
  getCourseTypeLabels,
  type CatalogFilterOption,
  type CatalogFilterState,
  isCatalogGroupChecked,
  isCatalogOptionChecked,
  getLanguageLabels,
  getLevelLabels,
  getFormatTypeLabels,
} from "../model/catalogFilters";
import { CatalogFilterCheckbox } from "./CatalogFilterCheckbox";
import { CollapsibleFilterSection } from "./CollapsibleFilterSection";
import { PriceRangeFilter } from "./PriceRangeFilter";

function ToggleOption({
  inset = false,
  option,
  state,
}: {
  inset?: boolean;
  option: CatalogFilterOption;
  state: CatalogFilterState;
}) {
  return (
    <CatalogFilterCheckbox
      checked={isCatalogOptionChecked(state, option)}
      href={buildCatalogHref(state, { toggle: option, filtersOpen: true })}
      label={option.label}
      inset={inset}
    />
  );
}

export async function CatalogFiltersSidebar({
  categories,
  state,
}: {
  categories: Category[];
  state: CatalogFilterState;
}) {
  const [t, tCommon, tEnums] = await Promise.all([
    getTranslations("CatalogFilters"),
    getTranslations("Common"),
    getTranslations("CatalogEnums"),
  ]);
  const LEVEL_LABELS = getLevelLabels(tEnums);
  const LANGUAGE_LABELS = getLanguageLabels(tEnums);
  const COURSE_TYPE_LABELS = getCourseTypeLabels(tEnums);
  const FORMAT_TYPE_LABELS = getFormatTypeLabels(tEnums);

  return (
    <aside className="absolute inset-x-0 top-0 z-20 rounded-[8px] bg-white px-6 py-6 shadow-[0_0_24px_rgba(167,186,250,0.35)] lg:static lg:inset-auto lg:z-auto">
      <div className="space-y-6">
        <CollapsibleFilterSection title={t("formatType")}>
          <CatalogFilterCheckbox
            checked={isCatalogGroupChecked(state, "format_type", ["self_paced", "scheduled"])}
            href={buildCatalogGroupHref(state, "format_type", ["self_paced", "scheduled"])}
            label={tEnums("mode.self_learning")}
          />
          <ToggleOption
            option={{
              label: FORMAT_TYPE_LABELS.self_paced,
              param: "format_type",
              value: "self_paced",
            }}
            state={state}
            inset
          />
          <ToggleOption
            option={{
              label: FORMAT_TYPE_LABELS.scheduled,
              param: "format_type",
              value: "scheduled",
            }}
            state={state}
            inset
          />
          <CatalogFilterCheckbox
            checked={isCatalogGroupChecked(state, "format_type", ["individual", "group"])}
            href={buildCatalogGroupHref(state, "format_type", ["individual", "group"])}
            label={tEnums("mode.with_teacher")}
          />
          <ToggleOption
            option={{
              label: FORMAT_TYPE_LABELS.individual,
              param: "format_type",
              value: "individual",
            }}
            state={state}
            inset
          />
          <ToggleOption
            option={{ label: FORMAT_TYPE_LABELS.group, param: "format_type", value: "group" }}
            state={state}
            inset
          />
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title={tCommon("categories")}>
          {categories.map((category) => (
            <CatalogFilterCheckbox
              key={category.id}
              checked={state.category === category.slug}
              href={buildCatalogHref(state, {
                category: state.category === category.slug ? undefined : category.slug,
                filtersOpen: true,
              })}
              label={category.name}
            />
          ))}
        </CollapsibleFilterSection>

        <p className="text-[0.73rem] text-(--color-text-secondary)">{t("inTheGroup")}</p>

        <div className="h-px bg-(--color-brand-lavender)" />

        <CollapsibleFilterSection title={t("courseRating")}>
          {["5", "4", "3"].map((rating) => (
            <CatalogFilterCheckbox
              key={rating}
              checked={state.rating_min === rating}
              href={buildCatalogHref(state, {
                rating_min: state.rating_min === rating ? undefined : rating,
                filtersOpen: true,
              })}
              label={rating === "5" ? t("fiveStarsOnly") : t("andMore", { rating })}
              inset
            />
          ))}
          <CatalogFilterCheckbox
            checked={!state.rating_min}
            href={buildCatalogHref(state, { rating_min: undefined, filtersOpen: true })}
            label={tCommon("all")}
            inset
          />
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title={t("difficultyLevel")}>
          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
            <ToggleOption
              key={value}
              option={{ label, param: "level", value }}
              state={state}
              inset
            />
          ))}
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title={t("courseLanguage")}>
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <ToggleOption
              key={value}
              option={{ label, param: "language", value }}
              state={state}
              inset
            />
          ))}
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title={t("courseType")}>
          {Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => (
            <ToggleOption
              key={value}
              option={{ label, param: "course_type", value }}
              state={state}
              inset
            />
          ))}
          <CatalogFilterCheckbox
            checked={false}
            href={buildCatalogHref(state, { filtersOpen: true })}
            label={t("workshops")}
            inset
          />
          <CatalogFilterCheckbox
            checked={false}
            href={buildCatalogHref(state, { filtersOpen: true })}
            label={t("masterclasses")}
            inset
          />
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title={t("priceRange")}>
          <PriceRangeFilter initialMin={state.price_min} initialMax={state.price_max} />
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title={t("promotions")}>
          <CatalogFilterCheckbox
            checked={Boolean(state.is_on_sale)}
            href={buildCatalogHref(state, {
              is_on_sale: state.is_on_sale ? undefined : true,
              filtersOpen: true,
            })}
            label={t("sale")}
            inset
          />
        </CollapsibleFilterSection>
      </div>
    </aside>
  );
}
