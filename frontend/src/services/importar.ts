import axios from "axios";


export interface ImportResult {
  status: string;
  df_model_rows: number;
  churn_rate: number;
  sheets: SheetInfo[];
}

export interface SheetInfo {
  hoja: string;
  filas: number;
  status: "ok" | "error";
}

export async function importClientsFromExcel(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  // We use a fresh axios instance to avoid api.ts forcing "application/json"
  const rawAxios = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  });

  const res = await rawAxios.post<{ status: string; message: string; data: ImportResult }>(
    "/clients/import",
    formData,
    {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );

  return res.data.data;
}
