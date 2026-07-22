import { X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

/** Edits the text of an existing chat message. */
export function EditMessageModal({ value, onChange, onClose, onSave }: Props) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-6">
      <div className="w-full max-w-[520px] rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Edit message</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className="mt-4 w-full resize-none rounded-lg border border-[#D8DDEA] px-3 py-2 text-sm outline-none focus:border-[#A7BAFA] focus:ring-2 focus:ring-[#D6E0FF]"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-[#D8DDEA] px-4 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-10 rounded-lg bg-black px-4 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
