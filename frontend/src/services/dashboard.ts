import api from "./api";
import type { ApiResponse, KpiData, ChartPoint } from "../types";

export const getDashboard = () =>
  api.get<ApiResponse<{ kpis: KpiData; churn_by_segment: ChartPoint[]; churn_by_dept: ChartPoint[]; monthly_trend: ChartPoint[] }>>("/dashboard");
