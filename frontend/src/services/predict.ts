import api from "./api";
import type { ApiResponse, PredictInput, PredictResult } from "../types";

export const predict = (data: PredictInput) =>
  api.post<ApiResponse<PredictResult>>("/predict", data);
