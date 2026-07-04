import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message?: string;
}

export function ErrorAlert({ message = "Ocurrió un error inesperado." }: ErrorAlertProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
