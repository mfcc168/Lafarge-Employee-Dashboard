import { useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  clearLabel: string;
  className?: string;
}

export default function SearchField({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  clearLabel,
  className = "",
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`workspace-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className="workspace-control">
        <Search size={18} strokeWidth={1.75} aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
        {value ? (
          <button
            type="button"
            className="workspace-search-clear"
            aria-label={clearLabel}
            onClick={() => {
              onValueChange("");
              inputRef.current?.focus();
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : (
          <span className="workspace-search-spacer" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
