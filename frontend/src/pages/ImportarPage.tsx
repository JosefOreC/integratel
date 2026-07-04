import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Download,
  Info,
  FileUp,
  Sparkles,
  BrainCircuit,
} from "lucide-react";
import api from "../services/api";
import { importClientsFromExcel, type ImportResult } from "../services/importar";

/* ─────────────────────────── Types ─────────────────────────── */
type Phase = "idle" | "uploading" | "processing" | "done" | "error";

/* ─────────────────────────── Helpers ─────────────────────────── */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const SHEETS = [
  "DIM_TIEMPO",
  "DIM_CLIENTE",
  "DIM_PRODUCTO",
  "DIM_NODO_RED",
  "DIM_EMPLEADO",
  "FACT_FACTURACION",
  "FACT_AVERIAS",
  "FACT_CHURN",
  "FACT_USO_RED",
];

/* ─────────────────────────── StatusBadge ─────────────────────── */
function StatusBadge({ status }: { status: "ok" | "error" | "updated" }) {
  const map = {
    ok:      { label: "Cargado",     cls: "badge-success" },
    updated: { label: "Actualizado", cls: "badge-info" },
    error:   { label: "Error",       cls: "badge-danger" },
  };
  const { label, cls } = map[status];
  return <span className={cls}>{label}</span>;
}

/* ─────────────────────────── Stat Card ────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className={`card p-5 flex items-center gap-4 border-l-4 ${accent}`}>
      <Icon className="w-7 h-7 text-current shrink-0 opacity-70" />
      <div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */
export function ImportarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [fakePct, setFakePct] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<{ message: string; auc: number } | null>(null);

  /* ── Animate fake processing progress ── */
  const animateProcessing = (callback: () => void) => {
    let pct = 0;
    const step = () => {
      pct += Math.random() * 14;
      if (pct >= 100) {
        setFakePct(100);
        setTimeout(callback, 200);
        return;
      }
      setFakePct(Math.round(pct));
      setTimeout(step, 100 + Math.random() * 80);
    };
    step();
  };

  /* ── File selection ── */
  const handleFile = useCallback((f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg("Solo se aceptan archivos Excel (.xlsx, .xls)");
      setPhase("error");
      return;
    }
    setFile(f);
    setPhase("idle");
    setResult(null);
    setErrorMsg("");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  /* ── Upload ── */
  const handleUpload = async () => {
    if (!file) return;
    try {
      setPhase("uploading");
      setUploadPct(0);
      setFakePct(0);
      setTrainResult(null);

      const data = await importClientsFromExcel(file, (pct) => {
        setUploadPct(pct);
        if (pct >= 100) setPhase("processing");
      });

      animateProcessing(() => {
        setResult(data);
        setPhase("done");
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Error al importar el archivo.";
      setErrorMsg(msg);
      setPhase("error");
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    setTrainResult(null);
    try {
      const res = await api.post("/predict/train");
      setTrainResult(res.data);
    } catch (err: any) {
      setTrainResult({ message: "Error al entrenar el modelo.", auc: 0 });
    } finally {
      setTraining(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPhase("idle");
    setResult(null);
    setErrorMsg("");
    setUploadPct(0);
    setFakePct(0);
    setTrainResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayPct = phase === "uploading" ? uploadPct : fakePct;
  const isRunning = phase === "uploading" || phase === "processing";

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <FileUp className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Importar Datos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Carga masiva de clientes desde un archivo Excel
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const link = document.createElement("a");
            link.href = "/plantilla_clientes.xlsx";
            link.download = "plantilla_clientes.xlsx";
            link.click();
          }}
          className="btn-secondary whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Descargar plantilla
        </button>
      </div>

      {/* ── Column guide ─────────────────────────────────────────── */}
      <div className="card p-4 flex gap-3 bg-primary-50 border-primary-200">
        <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
        <div className="text-sm text-primary-800">
          <p className="font-semibold mb-2">Hojas esperadas en el Data Warehouse:</p>
          <div className="flex flex-wrap gap-1.5">
            {SHEETS.map((sheet) => (
              <code
                key={sheet}
                className="px-2 py-0.5 bg-white border border-primary-200 rounded text-primary-700 text-xs font-mono shadow-sm"
              >
                {sheet}
              </code>
            ))}
          </div>
          <p className="text-xs text-primary-600 mt-2">
            El sistema procesará estas tablas para construir el modelo analítico de forma automática.
          </p>
        </div>
      </div>

      {/* ── Drop Zone ────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !isRunning && inputRef.current?.click()}
        className={[
          "relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          "flex flex-col items-center justify-center gap-5 py-20 px-8 text-center",
          dragOver
            ? "border-primary-400 bg-primary-50 scale-[1.005]"
            : file
            ? "border-green-400 bg-green-50 hover:bg-green-100/60"
            : "border-gray-300 bg-white hover:border-primary-300 hover:bg-primary-50/40",
          isRunning ? "pointer-events-none" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onInputChange}
        />

        {/* Triple concentric rings */}
        <div
          className={[
            "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-sm",
            file ? "bg-green-100" : dragOver ? "bg-primary-100" : "bg-gray-100",
          ].join(" ")}
        >
          <div
            className={[
              "w-16 h-16 rounded-full flex items-center justify-center",
              file ? "bg-green-200" : dragOver ? "bg-primary-200" : "bg-gray-200",
            ].join(" ")}
          >
            <div
              className={[
                "w-11 h-11 rounded-full flex items-center justify-center",
                file ? "bg-green-400" : dragOver ? "bg-primary-500" : "bg-gray-400",
              ].join(" ")}
            >
              {file ? (
                <FileSpreadsheet className="w-5 h-5 text-white" />
              ) : (
                <Upload className={["w-5 h-5 text-white transition-all", dragOver ? "-translate-y-0.5" : ""].join(" ")} />
              )}
            </div>
          </div>
        </div>

        {file ? (
          <div>
            <p className="font-bold text-gray-900 text-lg">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">{formatBytes(file.size)}</p>
            {!isRunning && (
              <p className="text-xs text-gray-400 mt-3">
                Haz clic para cambiar el archivo
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-bold text-gray-800 text-lg">
              {dragOver ? "Suelta el archivo aquí" : "Arrastra tu archivo Excel aquí"}
            </p>
            <p className="text-sm text-gray-400">o haz clic para explorar archivos</p>
            <div className="pt-2">
              <span className="text-xs text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full inline-block font-medium">
                .xlsx · .xls · máx. 10 MB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Error banner ─────────────────────────────────────────── */}
      {phase === "error" && (
        <div className="card p-4 border-red-200 bg-red-50 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Error en la importación</p>
            <p className="text-sm text-red-600 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ── Progress section ─────────────────────────────────────── */}
      {isRunning && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" />
              <span className="font-medium text-gray-700">
                {phase === "uploading" ? "Subiendo archivo…" : "Procesando filas…"}
              </span>
            </div>
            <span className="text-primary-600 font-bold tabular-nums">{displayPct}%</span>
          </div>

          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300"
              style={{ width: `${displayPct}%` }}
            />
          </div>

          <p className="text-xs text-gray-400">
            {phase === "uploading"
              ? "Transfiriendo el archivo al servidor…"
              : "Validando y guardando registros en la base de datos…"}
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {phase === "done" && result && (
        <div className="space-y-4 animate-fade-in">

          {/* Success banner */}
          <div className="card p-4 border-green-200 bg-green-50 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-sm">
                ¡Importación completada exitosamente!
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                El archivo fue procesado. Revisa el detalle por fila a continuación.
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          </div>

          {/* KPI stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <StatCard label="Clientes Analizados" value={result.df_model_rows} icon={CheckCircle2} accent="border-green-500 text-green-600" />
            <StatCard label="Tasa de Churn (%)" value={result.churn_rate} icon={AlertCircle} accent="border-primary-500 text-primary-600" />
          </div>

          {/* Sheet detail table */}
          {result.sheets && result.sheets.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <p className="font-semibold text-gray-800 text-sm">Resumen de Tablas</p>
                <span className="text-xs text-gray-400 font-medium">
                  {result.sheets.length} tablas importadas
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr className="text-left">
                      {["Tabla DW", "Filas Cargadas", "Estado"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.sheets.map((sheet, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          sheet.status === "error"
                            ? "bg-red-50 hover:bg-red-100/60"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-5 py-2.5 font-mono text-primary-700 font-medium">{sheet.hoja}</td>
                        <td className="px-5 py-2.5 text-gray-500 tabular-nums text-xs">{sheet.filas.toLocaleString()}</td>
                        <td className="px-5 py-2.5">
                          <StatusBadge status={sheet.status as any} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model Retraining Card */}
          <div className="card p-5 mt-4 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Actualizar Modelo de IA</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Entrena XGBoost con los nuevos datos cargados (puede demorar unos segundos).
                  </p>
                </div>
              </div>
              <button
                onClick={handleTrain}
                disabled={training}
                className="btn-primary bg-purple-600 hover:bg-purple-700 border-transparent disabled:opacity-50"
              >
                {training ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Entrenando...
                  </>
                ) : (
                  "Re-entrenar IA"
                )}
              </button>
            </div>
            
            {trainResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${trainResult.auc > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {trainResult.auc > 0 ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>
                  {trainResult.message}
                  {trainResult.auc > 0 && <span className="font-semibold ml-1">(AUC: {trainResult.auc})</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="flex gap-3 justify-end pt-1">
        {(file || phase !== "idle") && (
          <button
            onClick={reset}
            disabled={isRunning}
            className="btn-secondary disabled:opacity-40"
          >
            Limpiar
          </button>
        )}

        <button
          id="btn-importar"
          onClick={handleUpload}
          disabled={!file || isRunning || phase === "done"}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed min-w-[140px] justify-center"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {phase === "uploading" ? "Subiendo…" : "Procesando…"}
            </>
          ) : phase === "done" ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Importado
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Importar Excel
            </>
          )}
        </button>
      </div>
    </div>
  );
}
