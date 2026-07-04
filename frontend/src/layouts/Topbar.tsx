import { useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/clientes":   "Clientes",
  "/prediccion": "Predicción de Churn",
  "/reportes":   "Reportes",
  "/chat":       "Chat IA",
};

export function Topbar() {
  const { pathname } = useLocation();
  const base = "/" + pathname.split("/")[1];
  const title = titles[base] ?? "Integratel BI+AI";

  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-3">
        <button
          id="topbar-notifications"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button
          id="topbar-profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium">Admin</span>
        </button>
      </div>
    </header>
  );
}
