interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function Input({ label, error, id, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-medium font-mono text-gray-400">
                {label}
            </label>

            <input
                id={id}
                className={`w-full rounded-lg border px-3 py-2 outline-none transition ${
                    error
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-black"
                }`}
                {...props}
            />

            {error ? (
                <span className="text-sm text-red-500">
                    {error}
                </span>
            ) : null}
        </div>
    );
}