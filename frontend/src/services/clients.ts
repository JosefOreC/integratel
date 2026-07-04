import api from "./api";
import type { ApiResponse, Client } from "../types";

export const getClients = (params?: { search?: string; segmento?: string; departamento?: string }) =>
  api.get<ApiResponse<Client[]>>("/clients", { params });

export const getClient = (id: string) =>
  api.get<ApiResponse<Client>>(`/clients/${id}`);
