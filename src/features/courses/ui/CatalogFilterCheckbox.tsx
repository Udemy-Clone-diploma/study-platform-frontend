import Link from "next/link";

type CatalogFilterCheckboxProps = {
  checked: boolean;
  href: string;
  label: string;
  inset?: boolean;
};

export function CatalogFilterCheckbox({
  checked,
  href,
  label,
  inset = false,
}: CatalogFilterCheckboxProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 text-[0.73rem] leading-tight text-[#5c5660] ${
        inset ? "ml-5" : ""
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border-2 ${
          checked ? "border-[#0b55ff] bg-[#A7BAFA]/60" : "border-[#0b55ff] bg-transparent"
        }`}
      >
        {checked ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4 text-[#0b55ff]"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10.5 8.2 14.5 16 5.5" />
          </svg>
        ) : null}
      </span>
      {label}
    </Link>
  );
}
