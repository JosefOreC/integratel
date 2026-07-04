import { X, User, MapPin, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { Badge } from "./Badge";
import type { Client } from "../../types";

interface Props {
  client: Client | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

export function ClientDetailModal({ client, onClose }: Props) {
  if (!client) return null;

  const estadoBadge = {
    Activo:     <Badge variant="success">Activo</Badge>,
    Suspendido: <Badge variant="warning">Suspendido</Badge>,
    Baja:       <Badge variant="danger">Baja</Badge>,
  }[client.estado] ?? <Badge>{client.estado}</Badge>;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-primary-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-primary-300">ID de cliente</p>
              <p className="text-white font-semibold">{client.id_cliente}</p>
            </div>
          </div>
          <button
            id="modal-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-primary-300 hover:text-white hover:bg-primary-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-0">
          <DetailRow label="Segmento" value={<Badge variant="info">{client.segmento}</Badge>} />
          <DetailRow
            label="Departamento"
            value={
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {client.departamento}
              </span>
            }
          />
          <DetailRow
            label="Antigüedad"
            value={
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {client.antiguedad_meses} meses
              </span>
            }
          />
          <DetailRow
            label="ARPU Promedio"
            value={
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                S/. {client.arpu.toFixed(2)}
              </span>
            }
          />
          <DetailRow label="Estado" value={estadoBadge} />
          <DetailRow
            label="Riesgo Churn"
            value={
              client.churn === 1
                ? <Badge variant="danger"><AlertTriangle className="w-3 h-3 mr-1" />En riesgo</Badge>
                : <Badge variant="success">Sin riesgo</Badge>
            }
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Para predicción detallada, use el módulo de Predicción IA
          </p>
        </div>
      </div>
    </div>
  );
}
