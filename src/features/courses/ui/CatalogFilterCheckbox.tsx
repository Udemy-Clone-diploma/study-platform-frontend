import { Link } from "@/i18n/navigation";
import { Check } from "lucide-react";

type CatalogFilterCheckboxProps = {
  checked: boolean;
  href: string;
  label: string;
  inset?: boolean;
};

/** Single filter row in the catalog sidebar; renders as a Link so the URL stays the source of truth. */
export function CatalogFilterCheckbox({
  checked,
  href,
  label,
  inset = false,
}: CatalogFilterCheckboxProps) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`flex items-center gap-2 text-[0.73rem] leading-tight text-(--color-text-secondary) ${
        inset ? "ml-5" : ""
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border-2 border-(--color-blue) ${
          checked ? "bg-(--color-catalog-category-active)" : "bg-transparent"
        }`}
      >
        {checked ? (
          <Check aria-hidden="true" className="h-4 w-4 text-(--color-blue)" strokeWidth={3} />
        ) : null}
      </span>
      {label}
    </Link>
  );
}
