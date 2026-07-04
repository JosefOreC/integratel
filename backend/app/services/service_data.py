"""
service_data.py
================
Motor central de datos de Integratel.

Carga el archivo Excel del Data Warehouse (Integratel_dw.xlsx) y construye
el dataset analítico (df_model) exactamente como en el notebook c2_sem_15_in.py.

Todos los servicios (dashboard, clients, reports, bi_tools) consumen
los DataFrames expuestos aquí — NUNCA datos simulados.

El DW puede recargarse en caliente desde la pantalla de Importar.
"""

from __future__ import annotations

import io
import threading
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# RUTA POR DEFECTO DEL DW
# ─────────────────────────────────────────────────────────────────────────────
_DEFAULT_DW_PATH = Path(__file__).parent.parent.parent / "Integratel_dw.xlsx"

# ─────────────────────────────────────────────────────────────────────────────
# ESTADO GLOBAL (Singleton thread-safe)
# ─────────────────────────────────────────────────────────────────────────────
_lock = threading.Lock()

# Tablas DW
dim_cliente:   Optional[pd.DataFrame] = None
dim_tiempo:    Optional[pd.DataFrame] = None
dim_producto:  Optional[pd.DataFrame] = None
fact_fact:     Optional[pd.DataFrame] = None
fact_av:       Optional[pd.DataFrame] = None
fact_churn:    Optional[pd.DataFrame] = None
fact_red:      Optional[pd.DataFrame] = None

# Dataset analítico construido
df_model: Optional[pd.DataFrame] = None

# Meta de carga
_loaded: bool = False
_dw_file: str = ""
_load_error: str = ""


# ─────────────────────────────────────────────────────────────────────────────
# FUNCIÓN PRINCIPAL DE CARGA
# ─────────────────────────────────────────────────────────────────────────────
def load_dw(source: bytes | Path | None = None) -> dict:
    """
    Carga el Data Warehouse desde bytes (subida por usuario) o desde
    la ruta por defecto en disco.

    Retorna un dict con status, filas por tabla y resumen del df_model.
    """
    global dim_cliente, dim_tiempo, dim_producto
    global fact_fact, fact_av, fact_churn, fact_red
    global df_model, _loaded, _dw_file, _load_error

    with _lock:
        try:
            # ── 1. Abrir el ExcelFile ──────────────────────────────────────
            if isinstance(source, bytes):
                xl = pd.ExcelFile(io.BytesIO(source))
                _dw_file = "upload"
            else:
                path = source or _DEFAULT_DW_PATH
                if not Path(path).exists():
                    _load_error = f"Archivo no encontrado: {path}"
                    return {"status": "error", "message": _load_error}
                xl = pd.ExcelFile(path)
                _dw_file = str(path)

            # ── 2. Leer hojas ──────────────────────────────────────────────
            dim_tiempo   = pd.read_excel(xl, "DIM_TIEMPO")
            dim_cliente  = pd.read_excel(xl, "DIM_CLIENTE")
            dim_producto = pd.read_excel(xl, "DIM_PRODUCTO")
            fact_fact    = pd.read_excel(xl, "FACT_FACTURACION")
            fact_av      = pd.read_excel(xl, "FACT_AVERIAS")
            fact_churn   = pd.read_excel(xl, "FACT_CHURN")
            fact_red     = pd.read_excel(xl, "FACT_USO_RED")

            # Normalizar columna año
            if "año" not in fact_av.columns and "id_tiempo" in fact_av.columns:
                fact_av["año"] = fact_av["id_tiempo"].astype(str).str[:4].astype(int)
            if "año" not in fact_churn.columns and "id_tiempo" in fact_churn.columns:
                fact_churn["año"] = fact_churn["id_tiempo"].astype(str).str[:4].astype(int)
            if "año" not in fact_fact.columns and "id_tiempo" in fact_fact.columns:
                fact_fact["año"] = fact_fact["id_tiempo"].astype(str).str[:4].astype(int)
            if "año" not in fact_red.columns and "id_tiempo" in fact_red.columns:
                fact_red["año"] = fact_red["id_tiempo"].astype(str).str[:4].astype(int)

            # ── 3. Construir dataset analítico (igual que el notebook) ─────
            df_model = _build_df_model()

            _loaded = True
            _load_error = ""

            return {
                "status": "ok",
                "dim_cliente":   len(dim_cliente),
                "fact_fact":     len(fact_fact),
                "fact_av":       len(fact_av),
                "fact_churn":    len(fact_churn),
                "fact_red":      len(fact_red),
                "df_model_rows": len(df_model),
                "churn_rate":    round(df_model["churn"].mean() * 100, 2),
            }

        except Exception as exc:
            _load_error = str(exc)
            _loaded = False
            return {"status": "error", "message": _load_error}


def _build_df_model() -> pd.DataFrame:
    """Replicates the analytical dataset construction from c2_sem_15_in.py"""
    # Averías por cliente
    av_cl = (
        fact_av
        .groupby("id_cliente")
        .agg(
            num_reclamos=("genero_reclamo", "sum"),
            mttr_prom=("mttr_minutos", "mean"),
            sat_media=("satisfaccion_1_10", "mean"),
            total_averias=("id_cliente", "count"),
        )
        .reset_index()
    )

    # Facturación por cliente
    ff_cl = (
        fact_fact
        .groupby("id_cliente")
        .agg(
            arpu=("total_sol", "mean"),
            pct_venc=("dias_atraso", lambda x: (x > 0).mean() * 100),
            deuda_promedio=("dias_atraso", "mean"),
            max_dias_atraso=("dias_atraso", "max"),
        )
        .reset_index()
    )

    # Dataset base desde DIM_CLIENTE
    base_cols = ["id_cliente", "nombre", "segmento", "departamento",
                 "antiguedad_meses", "estado_actual"]
    # Sólo las que existan en el DataFrame
    base_cols = [c for c in base_cols if c in dim_cliente.columns]

    df = (
        dim_cliente[base_cols]
        .merge(av_cl, on="id_cliente", how="left")
        .merge(ff_cl, on="id_cliente", how="left")
    )

    # Variable objetivo
    df["churn"] = df["estado_actual"].map({
        "Activo": 0,
        "Suspendido": 0,
        "Baja": 1,
    })

    # Estado legible para la UI
    df["estado"] = df["estado_actual"].fillna("Activo")
    df.drop(columns=["estado_actual"], inplace=True, errors="ignore")

    # Limpieza
    df = df.dropna(subset=["churn"])
    df["num_reclamos"]  = df["num_reclamos"].fillna(0).astype(int)
    df["total_averias"] = df["total_averias"].fillna(0).astype(int)
    df["mttr_prom"]     = df["mttr_prom"].fillna(0).clip(0, 500)
    df["sat_media"]     = df["sat_media"].fillna(5.0)
    df["arpu"]          = df["arpu"].fillna(0.0)
    df["pct_venc"]      = df["pct_venc"].fillna(0.0).clip(0, 100)
    df["deuda_promedio"] = df["deuda_promedio"].fillna(0.0)
    df["max_dias_atraso"] = df["max_dias_atraso"].fillna(0.0)

    df["arpu"]  = df["arpu"].round(2)
    df["churn"] = df["churn"].astype(int)

    # Asegurar id_cliente como string
    df["id_cliente"] = df["id_cliente"].astype(str)

    return df.reset_index(drop=True)


# ─────────────────────────────────────────────────────────────────────────────
# ACCESORES PÚBLICOS
# ─────────────────────────────────────────────────────────────────────────────
def is_loaded() -> bool:
    return _loaded


def get_df_model() -> pd.DataFrame:
    """Returns the analytical DataFrame. Raises if not loaded."""
    if df_model is None:
        raise RuntimeError("Data Warehouse no cargado. Importa el archivo primero.")
    return df_model


def get_dim_cliente() -> pd.DataFrame:
    if dim_cliente is None:
        raise RuntimeError("Data Warehouse no cargado.")
    return dim_cliente


def get_fact_churn() -> pd.DataFrame:
    if fact_churn is None:
        raise RuntimeError("Data Warehouse no cargado.")
    return fact_churn


def get_fact_fact() -> pd.DataFrame:
    if fact_fact is None:
        raise RuntimeError("Data Warehouse no cargado.")
    return fact_fact


def get_fact_av() -> pd.DataFrame:
    if fact_av is None:
        raise RuntimeError("Data Warehouse no cargado.")
    return fact_av


def get_fact_red() -> pd.DataFrame:
    if fact_red is None:
        raise RuntimeError("Data Warehouse no cargado.")
    return fact_red
