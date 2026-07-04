import { useState } from "react";
import { Brain, AlertTriangle, CheckCircle, Info, Loader2, Search } from "lucide-react";
import { predict } from "../services/predict";
import api from "../services/api";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import type { PredictInput, PredictResult } from "../types";

const SEGMENTOS    = ["Corporativo", "PYME", "Residencial"];
const DEPARTAMENTOS = [
  "Arequipa", "Cajamarca", "Cusco", "Ica", "Junín",
  "La Libertad", "Lambayeque", "Lima", "Loreto", "Piura",
  "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali", "Áncash",
];

const INITIAL: PredictInput = {
  antiguedad_meses: 24, num_reclamos: 2, mttr_prom: 120, sat_media: 7,
  total_averias: 1, arpu: 180, pct_venc: 15, deuda_promedio: 10,
  max_dias_atraso: 5, segmento: "Residencial", departamento: "Lima",
};

type Field = { key: keyof PredictInput; label: string; min?: number; max?: number; step?: number };

const NUM_FIELDS: Field[] = [
  { key: "antiguedad_meses", label: "Antigüedad (meses)",       min: 0,   step: 1   },
  { key: "num_reclamos",     label: "N° de reclamos",           min: 0,   step: 1   },
  { key: "mttr_prom",        label: "MTTR promedio (min)",      min: 0,   step: 1   },
  { key: "sat_media",        label: "Satisfacción (1-10)",      min: 1,   max: 10,  step: 0.1 },
  { key: "arpu",             label: "ARPU promedio (S/.)",      min: 0,   step: 0.1 },
  { key: "pct_venc",         label: "% facturas vencidas",      min: 0,   max: 100, step: 0.1 },
  { key: "total_averias",    label: "Total averías",            min: 0,   step: 1   },
  { key: "deuda_promedio",   label: "Deuda promedio",    min: 0,   step: 0.1 },
  { key: "max_dias_atraso",  label: "Máx días de atraso",       min: 0,   step: 1   },
];

function RiskGauge({ probability }: { probability: number }) {
  const pctNum = probability * 100;
  const pctStr = pctNum.toFixed(2);
  const color = pctNum >= 70 ? "bg-red-500" : pctNum >= 40 ? "bg-amber-400" : "bg-green-500";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-gray-600">Probabilidad de Churn</span>
        <span className={pctNum >= 70 ? "text-red-600" : pctNum >= 40 ? "text-amber-600" : "text-green-600"}>
          {pctStr}%
        </span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pctNum}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>0%</span><span>Bajo &lt;40%</span><span>Medio 40-70%</span><span>Alto &gt;70%</span>
      </div>
    </div>
  );
}

export function PrediccionPage() {
  const [form, setForm]       = useState<PredictInput>(INITIAL);
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult]   = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const setNum = (key: keyof PredictInput, val: string) =>
    setForm((f) => ({ ...f, [key]: parseFloat(val) || 0 }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await predict(form);
      setResult(res.data.data);
    } catch {
      setError("No se pudo conectar con el backend. Verifica que FastAPI esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await api.get(`/clients/${searchId.trim()}`);
      const c = res.data.data;
      setForm({
        antiguedad_meses: c.antiguedad_meses,
        num_reclamos: c.num_reclamos,
        mttr_prom: c.mttr_prom,
        sat_media: c.sat_media,
        total_averias: c.total_averias,
        arpu: c.arpu,
        pct_venc: c.pct_venc,
        deuda_promedio: c.deuda_promedio,
        max_dias_atraso: c.max_dias_atraso,
        segmento: c.segmento,
        departamento: c.departamento,
      });
      setResult(null);
    } catch {
      setError(`Cliente ${searchId} no encontrado en el DW.`);
    } finally {
      setSearching(false);
    }
  };

  const riskVariant = (risk: string) =>
    risk === "ALTO" ? "danger" : risk === "MEDIO" ? "warning" : "success";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ── Formulario ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-600" />
            <CardTitle>Datos del Cliente</CardTitle>
          </div>
        </CardHeader>

        <div className="px-5 pt-4 pb-2 border-b border-gray-100 flex gap-2 items-end">
          <div className="flex-1">
            <label className="label">Cargar cliente real del Data Warehouse (ID)</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: 1, 2, 3..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            type="button"
            className="btn-primary px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white border-transparent"
            onClick={handleSearch}
            disabled={searching || !searchId}
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>

        <form id="predict-form" onSubmit={handleSubmit} className="space-y-3 p-5 pt-3">
          <div className="grid grid-cols-2 gap-3">
            {NUM_FIELDS.map(({ key, label, min, max, step }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  id={`input-${key}`}
                  type="number"
                  className="input"
                  min={min}
                  max={max}
                  step={step}
                  value={form[key] as number}
                  onChange={(e) => setNum(key, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Segmento</label>
              <select
                id="input-segmento"
                className="input"
                value={form.segmento}
                onChange={(e) => setForm((f) => ({ ...f, segmento: e.target.value }))}
              >
                {SEGMENTOS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Departamento</label>
              <select
                id="input-departamento"
                className="input"
                value={form.departamento}
                onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value }))}
              >
                {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {error && <ErrorAlert message={error} />}

          <button id="btn-predict" type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
              : <><Brain className="w-4 h-4" /> Predecir Churn</>}
          </button>
        </form>
      </Card>

      {/* ── Resultado ─────────────────────────────────────────── */}
      <div className="space-y-4">
        {!result && !loading && (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Completa el formulario</p>
            <p className="text-gray-400 text-sm mt-1">El resultado de la predicción aparecerá aquí</p>
          </Card>
        )}

        {result && (
          <>
            {/* Resultado principal */}
            <Card className={
              result.risk === "ALTO"  ? "border-l-4 border-red-500"  :
              result.risk === "MEDIO" ? "border-l-4 border-amber-400" :
              "border-l-4 border-green-500"
            }>
              <CardHeader>
                <CardTitle>Resultado del Modelo</CardTitle>
                <Badge variant={riskVariant(result.risk)}>Riesgo {result.risk}</Badge>
              </CardHeader>
              <RiskGauge probability={result.probability} />
            </Card>

            {/* Factores */}
            <Card>
              <CardHeader>
                <CardTitle>Factores Detectados</CardTitle>
              </CardHeader>
              {result.factors.length === 0 ? (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Sin factores críticos detectados
                </div>
              ) : (
                <ul className="space-y-2">
                  {result.factors.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Recomendación */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendación</CardTitle>
              </CardHeader>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{result.recommendation}</p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
