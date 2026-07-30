"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";

export type SearchSelectOption = {
  id: number;
  label: string;
  hint?: string;
};

type Props = {
  id: string;
  label: string;
  placeholder: string;
  value: SearchSelectOption | null;
  onChange: (option: SearchSelectOption | null) => void;
  loadOptions: (query: string) => Promise<SearchSelectOption[]>;
  error?: string;
};

export function SearchSelect({
  id,
  label,
  placeholder,
  value,
  onChange,
  loadOptions,
  error,
}: Props) {
  const t = useTranslations("SearchSelect");
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchSelectOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setLoadError(false);
      loadOptions(query.trim())
        .then((results) => {
          if (cancelled) return;
          setOptions(results);
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setOptions([]);
          setLoadError(true);
          setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, loadOptions]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function select(option: SearchSelectOption) {
    onChange(option);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label htmlFor={id} className="font-mono text-sm font-medium text-gray-400">
        {label}
      </label>

      {value ? (
        <div
          className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {value.label}
            {value.hint && <span className="text-(--color-text-secondary)"> {value.hint}</span>}
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label={t("clearSelectedAriaLabel", { label: label.toLowerCase() })}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-full p-0.5 text-(--color-text-secondary) transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-(--color-blue)"
            style={{ background: "none", border: "none" }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-listbox`}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            aria-invalid={error ? true : undefined}
            className={`w-full rounded-lg border px-3 py-2 outline-none transition ${
              error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"
            }`}
          />
          {loading && (
            <Loader2
              aria-hidden="true"
              size={16}
              className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-(--color-text-secondary)"
            />
          )}

          {open && (
            <ul
              id={`${id}-listbox`}
              role="listbox"
              className="absolute left-0 z-50 w-full rounded-lg bg-white"
              style={{
                top: "calc(100% + 4px)",
                maxHeight: 220,
                overflowY: "auto",
                padding: "6px 0",
                margin: 0,
                listStyle: "none",
                boxShadow: "var(--shadow-sort-dropdown)",
              }}
            >
              {loadError ? (
                <li
                  className="px-3 py-2 text-sm text-(--color-text-secondary)"
                  style={{ fontFamily: "var(--font-base)" }}
                >
                  {t("loadErrorMessage")}
                </li>
              ) : options.length === 0 && !loading ? (
                <li
                  className="px-3 py-2 text-sm text-(--color-text-secondary)"
                  style={{ fontFamily: "var(--font-base)" }}
                >
                  {t("noMatches")}
                </li>
              ) : (
                options.map((option) => (
                  <li key={option.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => select(option)}
                      className="flex w-full cursor-pointer flex-col items-start bg-transparent px-3 py-2 text-left transition hover:bg-(--color-brand-lavender-soft)"
                      style={{ border: "none", fontFamily: "var(--font-base)" }}
                    >
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)">
                        {option.label}
                      </span>
                      {option.hint && (
                        <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-(--color-text-secondary)">
                          {option.hint}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
