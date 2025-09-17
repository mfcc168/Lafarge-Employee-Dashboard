import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";

interface AutocompleteInputPropsBase {
  value: string;
  suggestions: string[];
  className?: string;
  rows?: number;
  openOnFocus?: boolean;
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

/**
 * A versatile autocomplete component that works as either an input or textarea,
 * showing suggestions based on user input.
 */
const AutocompleteInput: React.FC<AutocompleteInputProps> = (props) => {
  const {
    value,
    suggestions,
    className,
    rows = 2,
    isTextarea = false,
    openOnFocus = false, 
  } = props;
  // State for suggestions visibility  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>([]);

  // Ref for the container to handle click-outside events
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoized function to open suggestions dropdown
  const openSuggestions = useCallback(() => {
    setDisplayedSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [suggestions]);

  // Memoized filtered suggestions for better performance
  const filteredSuggestions = useMemo(() => {
    if (value.trim() === "") {
      return openOnFocus ? suggestions : [];
    }
    return suggestions.filter(
      (s) =>
        s.toLowerCase().includes(value.toLowerCase()) &&
        s.toLowerCase() !== value.toLowerCase()
    );
  }, [value, suggestions, openOnFocus]);

  // Effect to update suggestions visibility
  useEffect(() => {
    if (value.trim() === "") {
      setShowSuggestions(openOnFocus);
    } else {
      setShowSuggestions(filteredSuggestions.length > 0);
    }
    setDisplayedSuggestions(filteredSuggestions);
  }, [value, filteredSuggestions, openOnFocus]);

  // Effect to handle click-outside events
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

  /**
   * Handles suggestion selection by creating a synthetic change event
   * and passing it to the onChange handler - Memoized for performance
   */
  const handleSuggestionClick = useCallback((suggestion: string) => {
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
  }, [isTextarea, props]);

  return (
    <div className="relative" ref={containerRef}>
      
      {/* Conditional rendering of either textarea or input */}
      {isTextarea ? (
        <textarea
          value={value}
          onChange={props.onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={rows}
          className={`${className ?? ""} resize-none`}
          onFocus={() => openOnFocus && openSuggestions()}
          autoComplete="off"
          {...("textareaProps" in props ? props.textareaProps : {})}
        />
      ) : (
        <input
          value={value}
          onChange={props.onChange as React.ChangeEventHandler<HTMLInputElement>}
          className={className}
          autoComplete="off"
          onFocus={() => openOnFocus && openSuggestions()}
          spellCheck={false}
          {...("inputProps" in props ? props.inputProps : {})}
        />
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <ul className="absolute z-10 w-full max-h-40 overflow-auto rounded border border-gray-300 bg-white shadow-lg text-sm">
          {displayedSuggestions.map((suggestion, idx) => (
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

export default memo(AutocompleteInput);
