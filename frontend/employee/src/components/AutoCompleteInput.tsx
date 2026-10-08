import {
  useState,
  useId,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  memo,
} from "react";
import { createPortal } from "react-dom";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  KeyboardEvent,
  CSSProperties,
} from "react";
interface BaseProps {
  value: string;
  suggestions: string[];
  className?: string;
  rows?: number;
  openOnFocus?: boolean;
  portalSuggestions?: boolean;
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
    portalSuggestions = false,
  } = props;
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<CSSProperties>();
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
  useLayoutEffect(() => {
    if (!portalSuggestions || !expanded) return;
    const positionMenu = () => {
      const field = fieldRef.current;
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const region = field
        .closest(".report-table-region")
        ?.getBoundingClientRect();
      // Close when the input itself scrolls out of the visible table area.
      if (
        region &&
        (rect.bottom <= region.top + 44 ||
          rect.top >= region.bottom ||
          rect.right <= region.left ||
          rect.left >= region.right)
      ) {
        setOpen(false);
        return;
      }
      const below = window.innerHeight - rect.bottom;
      const above = rect.top;
      const opensAbove =
        below < Math.min(220, options.length * 44 + 14) && above > below;
      const width = Math.min(Math.max(180, rect.width), window.innerWidth - 16);
      setMenuPosition({
        position: "fixed",
        width,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        right: "auto",
        top: opensAbove ? "auto" : rect.bottom + 6,
        bottom: opensAbove ? window.innerHeight - rect.top + 6 : "auto",
        maxHeight: Math.max(
          44,
          Math.min(220, (opensAbove ? above : below) - 14),
        ),
        zIndex: 80,
      });
    };
    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [portalSuggestions, expanded, options.length]);
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
  const menu = expanded && (
    <ul
      id={id}
      role="listbox"
      className={`suggestions ${portalSuggestions ? "report-suggestions" : ""}`}
      style={portalSuggestions ? menuPosition : undefined}
    >
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
  );
  return (
    <div className="autocomplete" ref={fieldRef}>
      {props.isTextarea ? (
        <textarea {...props.textareaProps} {...shared} rows={rows} />
      ) : (
        <input {...props.inputProps} {...shared} />
      )}
      {portalSuggestions
        ? menuPosition && createPortal(menu, document.body)
        : menu}
    </div>
  );
}
export default memo(AutocompleteInput);
