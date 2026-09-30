import { useState, useId, useMemo, useEffect, memo } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  KeyboardEvent,
} from "react";
interface BaseProps {
  value: string;
  suggestions: string[];
  className?: string;
  rows?: number;
  openOnFocus?: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
  ) => void;
}
type Props = BaseProps &
  (
    | {
        isTextarea?: false;
        inputProps?: Omit<
          InputHTMLAttributes<HTMLInputElement>,
          keyof BaseProps
        >;
      }
    | {
        isTextarea: true;
        textareaProps?: Omit<
          TextareaHTMLAttributes<HTMLTextAreaElement>,
          keyof BaseProps
        >;
      }
  );
function AutocompleteInput(props: Props) {
  const {
    value,
    suggestions,
    className,
    rows = 2,
    openOnFocus = false,
  } = props;
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const options = useMemo(
    () =>
      value.trim() || openOnFocus
        ? suggestions
            .filter(
              (suggestion) =>
                suggestion.toLowerCase().includes(value.toLowerCase()) &&
                suggestion.toLowerCase() !== value.toLowerCase(),
            )
            .slice(0, 30)
        : [],
    [value, suggestions, openOnFocus],
  );
  const expanded = open && options.length > 0;
  useEffect(() => {
    if (expanded && active >= 0)
      document
        .getElementById(`${id}-${active}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [expanded, active, id]);
  const choose = (suggestion: string) => {
    props.onChange({
      target: { value: suggestion },
    } as ChangeEvent<HTMLInputElement>);
    setOpen(false);
    setActive(-1);
  };
  const keyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.nativeEvent.isComposing || event.altKey) return;
    if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      options.length
    ) {
      event.preventDefault();
      setOpen(true);
      setActive((index) =>
        event.key === "ArrowDown"
          ? Math.min(index + 1, options.length - 1)
          : Math.max(index - 1, 0),
      );
    }
    if (event.key === "Enter" && expanded && active >= 0 && options[active]) {
      event.preventDefault();
      choose(options[active]);
    }
  };
  const shared = {
    value,
    className,
    role: "combobox",
    autoComplete: "off",
    "aria-autocomplete": "list" as const,
    "aria-expanded": expanded,
    "aria-controls": expanded ? id : undefined,
    "aria-activedescendant":
      expanded && active >= 0 ? `${id}-${active}` : undefined,
    onChange: (
      event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    ) => {
      props.onChange(event);
      setOpen(true);
      setActive(-1);
    },
    onFocus: () => {
      if (openOnFocus || value.trim()) setOpen(true);
    },
    onBlur: () => {
      setOpen(false);
      setActive(-1);
    },
    onKeyDown: keyDown,
  };
  return (
    <div className="autocomplete">
      {props.isTextarea ? (
        <textarea {...props.textareaProps} {...shared} rows={rows} />
      ) : (
        <input {...props.inputProps} {...shared} />
      )}
      {expanded && (
        <ul id={id} role="listbox" className="suggestions">
          {options.map((suggestion, index) => (
            <li
              id={`${id}-${index}`}
              key={suggestion}
              role="option"
              aria-selected={index === active}
              onPointerDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export default memo(AutocompleteInput);
