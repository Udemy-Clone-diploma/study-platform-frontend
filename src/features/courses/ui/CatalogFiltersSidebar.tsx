import type { Category } from "@/features/courses/model/types/category";
import {
  buildCatalogHref,
  COURSE_TYPE_LABELS,
  DELIVERY_LABELS,
  type CatalogFilterOption,
  type CatalogFilterState,
  isCatalogOptionChecked,
  LANGUAGE_LABELS,
  LEVEL_LABELS,
  MODE_LABELS,
} from "@/features/courses/model/catalogFilters";
import { CatalogFilterCheckbox } from "@/features/courses/ui/CatalogFilterCheckbox";
import { CollapsibleFilterSection } from "@/features/courses/ui/CollapsibleFilterSection";

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

export function CatalogFiltersSidebar({
  categories,
  state,
}: {
  categories: Category[];
  state: CatalogFilterState;
}) {
  return (
    <aside className="rounded-[8px] bg-white px-6 py-6 shadow-[0_0_24px_rgba(167,186,250,0.35)]">
      <div className="space-y-6">
        <CollapsibleFilterSection title="Format">
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

        <CollapsibleFilterSection title="Categories">
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

        <p className="text-[0.73rem] text-[#7a747d]">In the group</p>

        <div className="h-px bg-[#9a9cff]" />

        <CollapsibleFilterSection title="Course rating">
          {["5", "4", "3"].map((rating) => (
            <CatalogFilterCheckbox
              key={rating}
              checked={state.rating_min === rating}
              href={buildCatalogHref(state, {
                rating_min: state.rating_min === rating ? undefined : rating,
                filtersOpen: true,
              })}
              label={rating === "5" ? "5 Stars only" : `${rating} and more`}
              inset
            />
          ))}
          <CatalogFilterCheckbox
            checked={!state.rating_min}
            href={buildCatalogHref(state, { rating_min: undefined, filtersOpen: true })}
            label="All"
            inset
          />
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title="Difficulty level">
          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
            <ToggleOption key={value} option={{ label, param: "level", value }} state={state} inset />
          ))}
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title="Course language">
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <ToggleOption key={value} option={{ label, param: "language", value }} state={state} inset />
          ))}
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title="Course type">
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
            label="Workshops"
            inset
          />
          <CatalogFilterCheckbox
            checked={false}
            href={buildCatalogHref(state, { filtersOpen: true })}
            label="Masterclasses"
            inset
          />
        </CollapsibleFilterSection>

        <CollapsibleFilterSection title="Promotions">
          <CatalogFilterCheckbox
            checked={Boolean(state.is_on_sale)}
            href={buildCatalogHref(state, {
              is_on_sale: state.is_on_sale ? undefined : true,
              filtersOpen: true,
            })}
            label="Sale"
            inset
          />
          <ToggleOption
            option={{ label: "Combo", param: "pricing_type", value: "installment" }}
            state={state}
            inset
          />
        </CollapsibleFilterSection>
      </div>
    </aside>
  );
}
