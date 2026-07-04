import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Brain, FileBarChart2, MessageSquare, FileUp } from "lucide-react";
import { clsx } from "clsx";

const nav = [
  { to: "/dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
  { to: "/clientes",   label: "Clientes",   Icon: Users },
  { to: "/prediccion", label: "Predicción", Icon: Brain },
  { to: "/reportes",   label: "Reportes",   Icon: FileBarChart2 },
  { to: "/chat",       label: "Chat IA",    Icon: MessageSquare },
  { to: "/importar",   label: "Importar",   Icon: FileUp },
];

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-primary-900 flex flex-col z-30">
      <div className="px-5 py-4 border-b border-primary-800">
        <p className="text-xs font-semibold text-primary-300 uppercase tracking-widest">Integratel</p>
        <h1 className="text-white font-bold text-base leading-tight mt-0.5">BI + AI Platform</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {nav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-700 text-white"
                  : "text-primary-200 hover:bg-primary-800 hover:text-white"
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-primary-800">
        <p className="text-xs text-primary-400">Integratel Perú © 2024</p>
      </div>
    </aside>
  );
}
