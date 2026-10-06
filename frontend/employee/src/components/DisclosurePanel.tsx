import { useEffect, useState, type ReactNode } from "react";

/** Mount details on first use, then keep their state while the panel closes. */
export default function DisclosurePanel({
  id,
  expanded,
  children,
}: {
  id: string;
  expanded: boolean;
  children: ReactNode;
}) {
  const [hasOpened, setHasOpened] = useState(expanded);
  useEffect(() => {
    if (expanded) setHasOpened(true);
  }, [expanded]);

  return (
    <div
      id={id}
      className={`finance-disclosure ${expanded ? "is-expanded" : ""}`}
      aria-hidden={!expanded}
      inert={!expanded}
    >
      <div>{(expanded || hasOpened) && children}</div>
    </div>
  );
}
