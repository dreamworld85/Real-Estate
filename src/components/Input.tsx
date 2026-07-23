import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  trailing?: ReactNode;
  error?: boolean;
}

export default function Input({ label, trailing, id, error, className = "", ...rest }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorClass = error 
    ? "border-rose-500 bg-rose-50/10 focus:border-rose-600 shadow-sm shadow-rose-100" 
    : "border-charcoal/12 focus:border-ink/40";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-charcoal/80">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-charcoal placeholder:text-slate/60 outline-none transition-all ${errorClass} ${className}`}
          {...rest}
        />
        {trailing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
