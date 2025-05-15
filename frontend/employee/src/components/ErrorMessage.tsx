import { ErrorMessageProps } from "@interfaces/index";


const ErrorMessage = ({ message, type }: ErrorMessageProps) => {
  const isError = type === "error";
  const bgColor = isError ? "bg-red-50" : "bg-yellow-50";
  const textColor = isError ? "text-red-500" : "text-yellow-500";
  const borderColor = isError ? "border-red-200" : "border-yellow-200";

  return (
    <div className={`flex justify-center items-center p-6 ${bgColor} border ${borderColor} rounded-lg animate-fadeIn`}>
      <p className={`${textColor} font-semibold text-lg`}>{message}</p>
    </div>
  );
};

export default ErrorMessage;
