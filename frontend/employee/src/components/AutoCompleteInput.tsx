import React, { useState, useRef, useEffect } from "react";

interface AutocompleteInputPropsBase {
  value: string;
  suggestions: string[];
  className?: string;
  rows?: number;
}

interface AutocompleteInputPropsInput extends AutocompleteInputPropsBase {
  isTextarea?: false;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    keyof AutocompleteInputPropsBase | "onChange" | "value" | "className"
  >;
}

interface AutocompleteInputPropsTextarea extends AutocompleteInputPropsBase {
  isTextarea: true;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  textareaProps?: Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    keyof AutocompleteInputPropsBase | "onChange" | "value" | "className"
  >;
}

type AutocompleteInputProps =
  | AutocompleteInputPropsInput
  | AutocompleteInputPropsTextarea;

const AutocompleteInput: React.FC<AutocompleteInputProps> = (props) => {
  const {
    value,
    suggestions,
    className,
    rows = 2,
    isTextarea = false,
  } = props;

  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim() === "") {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = suggestions.filter(
      (s) =>
        s.toLowerCase().includes(value.toLowerCase()) &&
        s.toLowerCase() !== value.toLowerCase()
    );
    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // You must cast the synthetic event to the correct type explicitly
  const handleSuggestionClick = (suggestion: string) => {
    if (isTextarea) {
      const syntheticEvent = {
        target: { value: suggestion },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      props.onChange(syntheticEvent);
    } else {
      const syntheticEvent = {
        target: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange(syntheticEvent);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={props.onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={rows}
          className={`${className ?? ""} resize-none`}
          autoComplete="off"
          {...("textareaProps" in props ? props.textareaProps : {})}
        />
      ) : (
        <input
          value={value}
          onChange={props.onChange as React.ChangeEventHandler<HTMLInputElement>}
          className={className}
          autoComplete="off"
          spellCheck={false}
          {...("inputProps" in props ? props.inputProps : {})}
        />
      )}

      {showSuggestions && (
        <ul className="absolute z-10 w-full max-h-40 overflow-auto rounded border border-gray-300 bg-white shadow-lg text-sm">
          {filteredSuggestions.map((suggestion, idx) => (
            <li
              key={idx}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              className="cursor-pointer px-3 py-1 hover:bg-indigo-100"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
