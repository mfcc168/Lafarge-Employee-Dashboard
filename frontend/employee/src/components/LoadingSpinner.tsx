interface LoadingSpinnerProps {
  variant?: "default" | "dots" | "pulse";
  size?: "sm" | "md" | "lg";
  message?: string;
}
/** A stable, compact loading state. Never replaces an editor during a save. */
export default function LoadingSpinner({
  size = "md",
  message = "Loading your workspace…",
}: LoadingSpinnerProps = {}) {
  return (
    <div
      className={`loading-state loading-${size}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-track" aria-hidden="true">
        <span />
      </span>
      <p>{message}</p>
    </div>
  );
}
