import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";

interface CustomFilterDropdownProps {
  value?: string;
  selectedValues?: string[];
  onChange?: (newValue: string) => void;
  onMultiChange?: (newValues: string[]) => void;
  options: string[];
  placeholder?: string;
  defaultValue?: string;
  isMultiSelect?: boolean;
  className?: string;
  maxHeight?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
}

export default function CustomFilterDropdown({
  value = "",
  selectedValues,
  onChange,
  onMultiChange,
  options,
  placeholder = "Select...",
  defaultValue = "",
  isMultiSelect = false,
  className = "",
  maxHeight = "180px",
  enableSearch = true,
  searchPlaceholder = "Search...",
}: CustomFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Multi-select internal state if not controlled externally
  const [internalMulti, setInternalMulti] = useState<string[]>(
    selectedValues || (value && value !== defaultValue ? [value] : [])
  );

  useEffect(() => {
    if (selectedValues) {
      setInternalMulti(selectedValues);
    }
  }, [selectedValues]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens, clear search when closed
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelectOption = (opt: string) => {
    if (isMultiSelect) {
      let updated: string[];
      if (internalMulti.includes(opt)) {
        updated = internalMulti.filter((item) => item !== opt);
      } else {
        // If option is a default/all value, replace everything
        if (opt.startsWith("All ")) {
          updated = [opt];
        } else {
          updated = [...internalMulti.filter((i) => !i.startsWith("All ")), opt];
        }
      }
      setInternalMulti(updated);
      if (onMultiChange) onMultiChange(updated);
      if (onChange) onChange(updated.join(", "));
    } else {
      if (onChange) onChange(opt);
      setIsOpen(false);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    if (isMultiSelect) {
      const updated = internalMulti.filter((item) => item !== opt);
      setInternalMulti(updated);
      if (onMultiChange) onMultiChange(updated);
      if (onChange) onChange(updated.join(", "));
    } else {
      if (onChange) onChange(defaultValue || options[0] || "");
    }
  };

  const displayTags = isMultiSelect
    ? internalMulti.filter((v) => v && !v.startsWith("All "))
    : value && !value.startsWith("All ") && value !== defaultValue
    ? [value]
    : [];

  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : options;

  const shouldShowSearch = enableSearch && options.length > 4;

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Outer Input Box matching reference design */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 bg-white border rounded-xl px-3 py-1.5 min-h-[38px] text-xs font-semibold cursor-pointer shadow-xs transition-all duration-200 select-none ${
          isOpen
            ? "border-blue-400 ring-2 ring-blue-400/30 shadow-md"
            : "border-blue-300/80 hover:border-blue-400"
        }`}
      >
        {/* Tag Pills Container */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {displayTags.length > 0 ? (
            displayTags.map((tag) => (
              /* Individual Tag Pill matching reference image */
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-gray-300 text-gray-800 text-xs font-medium shadow-2xs animate-in fade-in zoom-in-95 duration-150"
              >
                <span className="truncate max-w-[130px]">{tag}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveTag(e, tag)}
                  className="hover:bg-gray-100 p-0.5 rounded text-gray-400 hover:text-gray-700 transition-colors"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-700 font-medium truncate">{value || placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </div>

      {/* Floating Dropdown Popup List with Height & Scrollbar */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[99999] overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {shouldShowSearch && (
            <div 
              className="px-2.5 py-1.5 mb-1 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80"
              onClick={(e) => e.stopPropagation()}
            >
              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-700 rounded-full shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div
            style={{ maxHeight }}
            className="overflow-y-auto px-1.5 space-y-0.5 custom-dropdown-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-gray-400 text-center font-medium">
                No matching results found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = isMultiSelect ? internalMulti.includes(opt) : value === opt;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50/80 text-blue-700 font-bold"
                        : "text-gray-700 hover:bg-gray-100/70 hover:text-gray-900"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
