import { SelectHTMLAttributes, useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label: string;
  options: string[];
  placeholder?: string;
  error?: boolean;
  value?: string;
  onChange?: (e: any) => void;
}

export default function Select({
  label,
  options,
  placeholder = "Select",
  id,
  error,
  className = "",
  value = "",
  onChange,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorClass = error 
    ? "border-rose-500 bg-rose-50/10 focus:border-rose-600 shadow-sm shadow-rose-100" 
    : "border-charcoal/12 focus:border-ink/40";

  const handleSelect = (opt: string) => {
    if (onChange) {
      onChange({ target: { value: opt, name: selectId } });
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: "", name: selectId } });
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-charcoal/80">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 text-[15px] text-charcoal outline-none transition-all flex items-center justify-between cursor-pointer ${errorClass} ${className}`}
        >
          {value ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
              <span className="truncate max-w-[150px]">{value}</span>
              <button
                type="button"
                onClick={handleClear}
                className="hover:bg-blue-200/80 p-0.5 rounded-full text-blue-600 hover:text-blue-900 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ) : (
            <span className="text-slate">{placeholder}</span>
          )}
          <ChevronDown
            size={16}
            className={`text-slate transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[99999] overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto px-1.5 space-y-0.5 no-scrollbar">
              {options.map((opt, idx) => {
                const isSelected = value === opt;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    className={`px-3.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
