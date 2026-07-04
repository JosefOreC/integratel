// Global TypeScript types for Integratel BI+AI

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface KpiData {
  total_clients: number;
  churn_rate: number;
  arpu_avg: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  active_clients: number;
  churned_clients: number;
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface Client {
  id_cliente: string;
  segmento: string;
  departamento: string;
  antiguedad_meses: number;
  arpu: number;
  churn: number;
  estado: string;
}

export interface PredictInput {
  antiguedad_meses: number;
  num_reclamos: number;
  mttr_prom: number;
  sat_media: number;
  total_averias: number;
  arpu: number;
  pct_venc: number;
  deuda_promedio: number;
  max_dias_atraso: number;
  segmento: string;
  departamento: string;
}

export interface PredictResult {
  probability: number;
  prediction: number;
  risk: "ALTO" | "MEDIO" | "BAJO";
  recommendation: string;
  factors: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
