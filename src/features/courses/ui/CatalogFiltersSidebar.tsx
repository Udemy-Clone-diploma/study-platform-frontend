import { getTranslations } from "next-intl/server";
import type { Category } from "@/entities/course";
import {
  buildCatalogHref,
  getCourseTypeLabels,
  getDeliveryLabels,
  type CatalogFilterOption,
  type CatalogFilterState,
  isCatalogOptionChecked,
  getLanguageLabels,
  getLevelLabels,
  getModeLabels,
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
  const MODE_LABELS = getModeLabels(tEnums);
  const DELIVERY_LABELS = getDeliveryLabels(tEnums);
  const LEVEL_LABELS = getLevelLabels(tEnums);
  const LANGUAGE_LABELS = getLanguageLabels(tEnums);
  const COURSE_TYPE_LABELS = getCourseTypeLabels(tEnums);
  const FORMAT_TYPE_LABELS = getFormatTypeLabels(tEnums);

  return (
    <aside className="absolute inset-x-0 top-0 z-20 rounded-[8px] bg-white px-6 py-6 shadow-[0_0_24px_rgba(167,186,250,0.35)] lg:static lg:inset-auto lg:z-auto">
      <div className="space-y-6">
        <CollapsibleFilterSection title={t("format")}>
          <ToggleOption
            option={{ label: MODE_LABELS.self_learning, param: "mode", value: "self_learning" }}
            state={state}
          />
          <ToggleOption
            option={{
              label: DELIVERY_LABELS.self_paced,
              param: "delivery_type",
              value: "self_paced",
            }}
            state={state}
            inset
          />
          <ToggleOption
            option={{ label: DELIVERY_LABELS.scheduled, param: "delivery_type", value: "scheduled" }}
            state={state}
            inset
          />
          <ToggleOption
            option={{ label: MODE_LABELS.with_teacher, param: "mode", value: "with_teacher" }}
            state={state}
          />
          <ToggleOption
            option={{
              label: DELIVERY_LABELS.individual,
              param: "delivery_type",
              value: "individual",
            }}
            state={state}
            inset
          />
          <ToggleOption
            option={{ label: DELIVERY_LABELS.group, param: "delivery_type", value: "group" }}
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
            <ToggleOption key={value} option={{ label, param: "level", value }} state={state} inset />
          ))}
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title={t("courseLanguage")}>
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <ToggleOption key={value} option={{ label, param: "language", value }} state={state} inset />
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

        <CollapsibleFilterSection title={t("formatType")}>
          {(Object.entries(FORMAT_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
            <ToggleOption
              key={value}
              option={{ label, param: "format_type", value }}
              state={state}
              inset
            />
          ))}
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
