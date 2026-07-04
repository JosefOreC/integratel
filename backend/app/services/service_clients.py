"""
service_clients.py
==================
Expone la lista de clientes y el detalle individual, tomando los datos
del dataset analítico construido desde el DW real (service_data.py).

La función import_dw_from_excel recarga el DW completo cuando el usuario
sube un nuevo archivo desde la pantalla de Importar.
"""

from __future__ import annotations

from typing import Optional
from app.services import service_data


# ─────────────────────────────────────────────────────────────────────────────
# LECTURA DE CLIENTES
# ─────────────────────────────────────────────────────────────────────────────

def get_clients(
    search:      Optional[str] = None,
    segmento:    Optional[str] = None,
    departamento: Optional[str] = None,
) -> list[dict]:
    """
    Devuelve la lista de clientes del dataset analítico.
    Soporta búsqueda por id_cliente / nombre y filtros de segmento / departamento.
    """
    if not service_data.is_loaded():
        return []

    df = service_data.get_df_model().copy()

    if search:
        s = search.lower()
        df = df[
            df["id_cliente"].str.lower().str.contains(s, na=False) |
            df["nombre"].str.lower().str.contains(s, na=False)
        ]

    if segmento:
        df = df[df["segmento"] == segmento]

    if departamento:
        df = df[df["departamento"] == departamento]

    # Columnas que necesita el frontend
    cols = [
        "id_cliente", "nombre", "segmento", "departamento",
        "antiguedad_meses", "arpu", "churn", "estado",
        "num_reclamos", "mttr_prom", "sat_media",
        "total_averias", "pct_venc", "deuda_promedio", "max_dias_atraso",
    ]
    cols = [c for c in cols if c in df.columns]
    return df[cols].to_dict(orient="records")


def get_client_by_id(client_id: str) -> Optional[dict]:
    if not service_data.is_loaded():
        return None
    df = service_data.get_df_model()
    row = df[df["id_cliente"] == str(client_id)]
    if row.empty:
        return None
    return row.iloc[0].to_dict()


# ─────────────────────────────────────────────────────────────────────────────
# IMPORTACIÓN DEL DW COMPLETO
# ─────────────────────────────────────────────────────────────────────────────

def import_dw_from_excel(file_bytes: bytes) -> dict:
    """
    Recarga completamente el Data Warehouse desde un archivo Excel subido por
    el usuario. El archivo debe tener las mismas hojas que Integratel_dw.xlsx:
      DIM_TIEMPO, DIM_CLIENTE, DIM_PRODUCTO, DIM_NODO_RED, DIM_EMPLEADO,
      FACT_FACTURACION, FACT_AVERIAS, FACT_CHURN, FACT_USO_RED

    Retorna estadísticas de la carga para mostrarlas en la UI.
    """
    result = service_data.load_dw(source=file_bytes)

    if result["status"] == "error":
        return result

    # Construir detalle de hojas para la tabla de resultados de la UI
    sheets_info = [
        {"hoja": "DIM_CLIENTE",     "filas": result.get("dim_cliente", 0),   "status": "ok"},
        {"hoja": "FACT_FACTURACION","filas": result.get("fact_fact", 0),      "status": "ok"},
        {"hoja": "FACT_AVERIAS",    "filas": result.get("fact_av", 0),        "status": "ok"},
        {"hoja": "FACT_CHURN",      "filas": result.get("fact_churn", 0),     "status": "ok"},
        {"hoja": "FACT_USO_RED",    "filas": result.get("fact_red", 0),       "status": "ok"},
    ]

    return {
        "status":       "success",
        "df_model_rows": result["df_model_rows"],
        "churn_rate":   result["churn_rate"],
        "sheets":       sheets_info,
    }
