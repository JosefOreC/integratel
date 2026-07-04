import { useState, useEffect } from "react";
import { FileDown, FileSpreadsheet, FileText, Users, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import api from "../services/api";
import type { Client, ApiResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ExportState { loading: boolean; done: boolean; error: string }
const IDLE: ExportState = { loading: false, done: false, error: "" };

function ExportButton({
  id, label, icon: Icon, color, url, ext, total,
}: {
  id: string; label: string; icon: typeof FileDown; color: string; url: string; ext: string; total: number;
}) {
  const [st, setSt] = useState<ExportState>(IDLE);

  const handleExport = async () => {
    setSt({ loading: true, done: false, error: "" });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const link  = document.createElement("a");
      link.href   = URL.createObjectURL(blob);
      link.download = `clientes_integratel.${ext}`;
      link.click();
      setSt({ loading: false, done: true, error: "" });
      setTimeout(() => setSt(IDLE), 3000);
    } catch {
      setSt({ loading: false, done: false, error: "Backend no disponible. Inicia FastAPI." });
      setTimeout(() => setSt(IDLE), 4000);
    }
  };

  return (
    <div className="card p-6 flex flex-col items-center gap-4 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-400 mt-1">{total.toLocaleString()} clientes · {ext.toUpperCase()}</p>
      </div>

      {st.error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" /> {st.error}
        </div>
      )}
      {st.done && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="w-3.5 h-3.5" /> Descargado correctamente
        </div>
      )}

      <button
        id={id}
        className="btn-primary w-full justify-center"
        onClick={handleExport}
        disabled={st.loading || total === 0}
      >
        <FileDown className="w-4 h-4" />
        {st.loading ? "Generando..." : `Exportar ${ext.toUpperCase()}`}
      </button>
    </div>
  );
}

export function ReportesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get<ApiResponse<Client[]>>("/clients")
      .then(res => {
        setClients(res.data.data.slice(0, 5));
        setTotal(res.data.data.length);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stat banner */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total clientes",   value: total.toLocaleString(),  Icon: Users        },
          { label: "Formatos",         value: "CSV · Excel", Icon: FileText },
          { label: "Actualización",    value: "En tiempo real", Icon: FileDown },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold text-gray-800 text-sm">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ExportButton
          id="btn-export-csv"
          label="Exportar a CSV"
          icon={FileText}
          color="bg-green-600"
          url={`${API_URL}/reports/export/csv`}
          ext="csv"
          total={total}
        />
        <ExportButton
          id="btn-export-excel"
          label="Exportar a Excel"
          icon={FileSpreadsheet}
          color="bg-primary-600"
          url={`${API_URL}/reports/export/excel`}
          ext="xlsx"
          total={total}
        />
      </div>

      {/* Preview table */}
      <Card>
        <CardHeader>
          <CardTitle>Vista previa del reporte</CardTitle>
          <span className="text-xs text-gray-400">Primeras 5 filas reales</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["ID Cliente", "Segmento", "Departamento", "Antigüedad", "ARPU", "Estado", "Churn"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((r) => (
                <tr key={r.id_cliente} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-primary-700 text-xs">{r.id_cliente}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.segmento}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.departamento}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.antiguedad_meses} meses</td>
                  <td className="px-4 py-2.5 text-gray-700">S/. {r.arpu}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.estado}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-medium ${r.churn === 1 ? "text-red-600" : "text-green-600"}`}>
                      {r.churn === 1 ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay datos cargados en el Data Warehouse.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
