"use client";

import Image from "next/image";

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export function AuthField({
  id,
  label,
  type = "text",
  error,
  showPassword = false,
  onTogglePassword,
  className = "",
  ...props
}: AuthFieldProps) {
  const resolvedType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="space-y-2 text-left">
      <label
        htmlFor={id}
        className="block text-[1.1rem] font-medium tracking-[0.01em] text-[#1a171b]"
      >
        {label}
      </label>

      <div className="flex items-end gap-3 border-b border-black/35 pb-2 transition focus-within:border-black/70">
        <input
          id={id}
          type={resolvedType}
          className={`min-w-0 flex-1 border-0 bg-transparent text-base text-[#1a171b] outline-none placeholder:text-[#8b858d] ${className}`}
          {...props}
        />

        {type === "password" && onTogglePassword ? (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#78717a] transition hover:bg-black/5 hover:text-black"
          >
            <Image
              src={showPassword ? "/icons/eye open.png" : "/icons/closed eye.png"}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
              className="h-[1.1rem] w-[1.1rem] object-contain"
            />
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[#be3b3b]">{error}</p> : null}
    </div>
  );
}
