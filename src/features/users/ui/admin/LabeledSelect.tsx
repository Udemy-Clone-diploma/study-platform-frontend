"use client";

import { SelectField, type SelectOption } from "@/shared/ui/SelectField";

type Props = {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function LabeledSelect({ label, options, value, onChange, error }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-sm font-medium text-gray-400">{label}</span>
      <SelectField options={options} value={value} onChange={onChange} />
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
