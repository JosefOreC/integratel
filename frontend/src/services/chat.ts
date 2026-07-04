import api from "./api";
import type { ApiResponse } from "../types";

export const sendChat = (message: string) =>
  api.post<ApiResponse<{ reply: string }>>("/chat", { message });

export const getReports = () =>
  api.get<ApiResponse<unknown>>("/reports");
