import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, TrendingDown, DollarSign, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { getDashboard } from "../services/dashboard";
import { KpiCard } from "../components/ui/KpiCard";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/Loading";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import type { KpiData, ChartPoint } from "../types";

// ── Colores de la paleta del sistema ────────────────────────────
const PIE_COLORS = ["#2563eb", "#60a5fa", "#93c5fd"];
const BAR_COLOR  = "#2563eb";
const AREA_COLOR = "#2563eb";

// ── Datos de fallback para demo sin backend ──────────────────────
const FALLBACK = {
  kpis: {
    total_clients: 5200, churn_rate: 12.0, arpu_avg: 185.4,
    high_risk: 480, medium_risk: 910, low_risk: 3810,
    active_clients: 4576, churned_clients: 624,
  },
  churn_by_segment: [
    { name: "Residencial", value: 62 },
    { name: "PYME",        value: 28 },
    { name: "Corporativo", value: 10 },
  ],
  churn_by_dept: [
    { name: "Lima",        value: 210 },
    { name: "Arequipa",    value: 85  },
    { name: "La Libertad", value: 74  },
    { name: "Piura",       value: 62  },
    { name: "Cusco",       value: 51  },
    { name: "Junín",       value: 43  },
    { name: "Otros",       value: 99  },
  ],
  monthly_trend: [
    { name: "Ene", value: 95  }, { name: "Feb", value: 102 },
    { name: "Mar", value: 88  }, { name: "Abr", value: 115 },
    { name: "May", value: 108 }, { name: "Jun", value: 97  },
    { name: "Jul", value: 124 }, { name: "Ago", value: 110 },
    { name: "Sep", value: 99  }, { name: "Oct", value: 118 },
    { name: "Nov", value: 131 }, { name: "Dic", value: 104 },
  ],
};

interface DashboardData {
  kpis: KpiData;
  churn_by_segment: ChartPoint[];
  churn_by_dept: ChartPoint[];
  monthly_trend: ChartPoint[];
}

export function DashboardPage() {
  const [data, setData]       = useState<DashboardData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => setError("Backend no disponible — mostrando datos de demostración."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando dashboard..." />;

  const { kpis, churn_by_segment, churn_by_dept, monthly_trend } = data;

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}

      {/* ── KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Clientes"
          value={kpis.total_clients.toLocaleString()}
          icon={Users}
          subtitle={`${kpis.active_clients.toLocaleString()} activos`}
        />
        <KpiCard
          label="Tasa de Churn"
          value={`${kpis.churn_rate}%`}
          icon={TrendingDown}
          variant="danger"
          subtitle={`${kpis.churned_clients.toLocaleString()} bajas`}
        />
        <KpiCard
          label="ARPU Promedio"
          value={`S/. ${kpis.arpu_avg.toFixed(2)}`}
          icon={DollarSign}
          variant="success"
          subtitle="ingreso por usuario"
        />
        <KpiCard
          label="Riesgo Alto"
          value={kpis.high_risk.toLocaleString()}
          icon={AlertTriangle}
          variant="warning"
          subtitle={`${kpis.medium_risk.toLocaleString()} en riesgo medio`}
        />
      </div>

      {/* ── Fila de gráficos: tendencia + segmentos ───────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Tendencia mensual */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Eventos de Churn — Tendencia Mensual</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly_trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AREA_COLOR} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={AREA_COLOR} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(v: number) => [v, "Eventos"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={AREA_COLOR}
                strokeWidth={2}
                fill="url(#churnGrad)"
                dot={{ r: 3, fill: AREA_COLOR }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Churn por segmento */}
        <Card>
          <CardHeader>
            <CardTitle>Churn por Segmento</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={churn_by_segment}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
              >
                {churn_by_segment.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(v: number) => [`${v}%`, "Participación"]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Churn por departamento ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Churn por Departamento</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Número de clientes dados de baja</p>
          </div>
        </CardHeader>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={churn_by_dept} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v: number) => [v, "Clientes"]}
            />
            <Bar dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Distribución de riesgo ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4 border-l-4 border-red-500">
          <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Riesgo Alto</p>
            <p className="text-xl font-bold text-red-600">{kpis.high_risk.toLocaleString()}</p>
            <p className="text-xs text-gray-400">≥ 70% probabilidad de churn</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 border-l-4 border-amber-400">
          <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Riesgo Medio</p>
            <p className="text-xl font-bold text-amber-600">{kpis.medium_risk.toLocaleString()}</p>
            <p className="text-xs text-gray-400">40% – 69% probabilidad</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 border-l-4 border-green-500">
          <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Riesgo Bajo</p>
            <p className="text-xl font-bold text-green-600">{kpis.low_risk.toLocaleString()}</p>
            <p className="text-xs text-gray-400">&lt; 40% probabilidad</p>
          </div>
        </div>
      </div>
    </div>
  );
}
