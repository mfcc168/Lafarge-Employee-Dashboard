import { ErrorMessageProps } from "@interfaces/index";

/**
 * A reusable component for displaying error or warning messages with appropriate styling.
 *
 * @param {Object} props - Component props
 * @param {string} props.message - The message text to display
 * @param {"error" | "warning"} props.type - Determines the styling (error: red, warning: yellow)
 * returns a styled message component
 */
const ErrorMessage = ({ message, type }: ErrorMessageProps) => {
  // Determine if this is an error message
  const isError = type === "error";

  // Dynamic styling based on message type
  const bgColor = isError ? "bg-gray-50" : "bg-gray-50"; // Background color
  const textColor = isError ? "text-gray-600" : "text-gray-600"; // Text color
  const borderColor = isError ? "border-gray-200" : "border-gray-200"; // Border color

  return (
    <div
      className={`
        flex justify-center items-center p-6
        ${bgColor} border ${borderColor}
        rounded-lg
      `}
    >
      {/* Message text with appropriate styling */}
      <p className={`${textColor} font-semibold text-lg`}>{message}</p>
    </div>
  );
};

export default ErrorMessage;
