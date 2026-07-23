import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  placeholder?: string;
  error?: boolean;
}

export default function Select({
  label,
  options,
  placeholder = "Select",
  id,
  error,
  className = "",
  ...rest
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorClass = error 
    ? "border-rose-500 bg-rose-50/10 focus:border-rose-600 shadow-sm shadow-rose-100" 
    : "border-charcoal/12 focus:border-ink/40";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-charcoal/80">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          defaultValue=""
          className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 text-[15px] text-charcoal outline-none transition-all ${errorClass} ${className}`}
          {...rest}
        >
          <option value="" disabled className="text-slate">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
        />
      </div>
    </div>
  );
}
