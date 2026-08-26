interface ApplicationTextareaFieldProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> {
  id: string;
  label: string;
  error?: string;
}

/** Textarea styled to match AuthField, for the multi-line teacher application fields (bio, experience, motivation). */
export function ApplicationTextareaField({
  id,
  label,
  error,
  className = "",
  rows = 4,
  ...props
}: ApplicationTextareaFieldProps) {
  return (
    <div className="space-y-2 text-left">
      <label
        htmlFor={id}
        className="block text-[1.1rem] font-medium tracking-[0.01em] text-[#1a171b]"
      >
        {label}
      </label>

      <div className="border-b border-black/35 pb-2 transition focus-within:border-black/70">
        <textarea
          id={id}
          rows={rows}
          className={`min-w-0 w-full resize-y border-0 bg-transparent text-base text-[#1a171b] outline-none placeholder:text-[#8b858d] ${className}`}
          {...props}
        />
      </div>

      {error ? <p className="text-sm text-[#be3b3b]">{error}</p> : null}
    </div>
  );
}
