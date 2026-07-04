import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { getClients } from "../services/clients";
import { Badge } from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/Loading";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { ClientDetailModal } from "../components/ui/ClientDetailModal";
import type { Client } from "../types";

const SEGMENTOS    = ["", "Corporativo", "PYME", "Residencial"];
const DEPARTAMENTOS = ["", "Lima", "Arequipa", "La Libertad", "Piura", "Cusco", "Junín"];
const PAGE_SIZE    = 12;

const estadoBadge = (estado: string) => {
  if (estado === "Activo")     return <Badge variant="success">Activo</Badge>;
  if (estado === "Suspendido") return <Badge variant="warning">Suspendido</Badge>;
  return <Badge variant="danger">Baja</Badge>;
};

export function ClientesPage() {
  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [segmento, setSegmento] = useState("");
  const [depto, setDepto]       = useState("");
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Client | null>(null);

  useEffect(() => {
    setLoading(true);
    getClients({ search: search || undefined, segmento: segmento || undefined, departamento: depto || undefined })
      .then((res) => { setClients(res.data.data); setPage(1); })
      .catch(() => setError("No se pudo conectar al backend."))
      .finally(() => setLoading(false));
  }, [search, segmento, depto]);

  const totalPages = Math.ceil(clients.length / PAGE_SIZE);
  const paginated  = useMemo(
    () => clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [clients, page]
  );

  return (
    <div className="space-y-4">
      {error && <ErrorAlert message={error} />}

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="clients-search"
            className="input pl-9"
            placeholder="Buscar por ID o nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="filter-segmento"
          className="input w-44"
          value={segmento}
          onChange={(e) => setSegmento(e.target.value)}
        >
          {SEGMENTOS.map((s) => (
            <option key={s} value={s}>{s || "Todos los segmentos"}</option>
          ))}
        </select>

        <select
          id="filter-departamento"
          className="input w-44"
          value={depto}
          onChange={(e) => setDepto(e.target.value)}
        >
          {DEPARTAMENTOS.map((d) => (
            <option key={d} value={d}>{d || "Todos los departamentos"}</option>
          ))}
        </select>

        <span className="text-sm text-gray-500 ml-auto whitespace-nowrap">
          {clients.length.toLocaleString()} clientes
        </span>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <LoadingSpinner text="Cargando clientes…" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["ID Cliente", "Segmento", "Departamento", "Antigüedad", "ARPU", "Estado", "Churn"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((c) => (
                  <tr
                    key={c.id_cliente}
                    className="hover:bg-primary-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-4 py-3 font-mono text-primary-700 font-medium">{c.id_cliente}</td>
                    <td className="px-4 py-3"><Badge variant="info">{c.segmento}</Badge></td>
                    <td className="px-4 py-3 text-gray-700">{c.departamento}</td>
                    <td className="px-4 py-3 text-gray-700">{c.antiguedad_meses} meses</td>
                    <td className="px-4 py-3 text-gray-700">S/. {c.arpu.toFixed(2)}</td>
                    <td className="px-4 py-3">{estadoBadge(c.estado)}</td>
                    <td className="px-4 py-3">
                      {c.churn === 1
                        ? <Badge variant="danger">Sí</Badge>
                        : <Badge variant="success">No</Badge>}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No se encontraron clientes con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Paginación ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              id="prev-page"
              className="btn-secondary px-2"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="next-page"
              className="btn-secondary px-2"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de detalle ─────────────────────────────────────── */}
      <ClientDetailModal client={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
