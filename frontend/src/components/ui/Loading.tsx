import { Loader2 } from "lucide-react";

export function LoadingSpinner({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}
