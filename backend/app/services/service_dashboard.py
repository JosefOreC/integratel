"""
service_dashboard.py
====================
Calcula KPIs y datos de gráficos desde el dataset analítico real del DW.
"""

from __future__ import annotations

import pandas as pd
from app.services import service_data

_MES_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
               "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


def get_dashboard_data() -> dict:
    if not service_data.is_loaded():
        return _fallback()

    df   = service_data.get_df_model()
    fc   = service_data.get_fact_churn()
    fav  = service_data.get_fact_av()

    # ── KPIs ──────────────────────────────────────────────────────────
    total_clients  = len(df)
    churned        = int(df["churn"].sum())
    churn_rate     = round(df["churn"].mean() * 100, 2)
    active_clients = total_clients - churned
    arpu_avg       = round(float(df["arpu"].mean()), 2)

    # Riesgo: usamos regla simple sobre arpu + reclamos para simular probabilidad
    # (el modelo real se usa en /predict; aquí sólo necesitamos una distribución)
    df_r = df.copy()
    score = (
        (df_r["num_reclamos"] / df_r["num_reclamos"].max().clip(1)) * 0.35 +
        (df_r["pct_venc"] / 100) * 0.35 +
        ((10 - df_r["sat_media"]) / 9).clip(0, 1) * 0.30
    ).fillna(0)

    high_risk   = int((score >= 0.60).sum())
    medium_risk = int(((score >= 0.35) & (score < 0.60)).sum())
    low_risk    = total_clients - high_risk - medium_risk

    kpis = {
        "total_clients":   total_clients,
        "churn_rate":      churn_rate,
        "arpu_avg":        arpu_avg,
        "high_risk":       high_risk,
        "medium_risk":     medium_risk,
        "low_risk":        low_risk,
        "active_clients":  active_clients,
        "churned_clients": churned,
    }

    # ── Churn por segmento ─────────────────────────────────────────────
    seg_counts = (
        df[df["churn"] == 1]
        .groupby("segmento")
        .size()
        .reset_index(name="value")
        .rename(columns={"segmento": "name"})
        .sort_values("value", ascending=False)
    )
    churn_by_segment = seg_counts.to_dict(orient="records")

    # ── Churn por departamento (top 7) ──────────────────────────────────
    dept_counts = (
        df[df["churn"] == 1]
        .groupby("departamento")
        .size()
        .reset_index(name="value")
        .rename(columns={"departamento": "name"})
        .sort_values("value", ascending=False)
    )
    top7 = dept_counts.head(7)
    rest = dept_counts.iloc[7:]["value"].sum()
    churn_by_dept = top7.to_dict(orient="records")
    if rest > 0:
        churn_by_dept.append({"name": "Otros", "value": int(rest)})

    # ── Tendencia mensual de churn (último año disponible del FACT_CHURN) ──
    monthly_trend = _monthly_trend(fc)

    return {
        "kpis":             kpis,
        "churn_by_segment": churn_by_segment,
        "churn_by_dept":    churn_by_dept,
        "monthly_trend":    monthly_trend,
    }


def _monthly_trend(fc: pd.DataFrame) -> list[dict]:
    """Agrupa eventos de churn por mes en el último año con datos."""
    try:
        if "año" not in fc.columns or "id_tiempo" not in fc.columns:
            return []

        last_year = int(fc["año"].max())
        monthly = (
            fc[fc["año"] == last_year]
            .assign(mes=fc["id_tiempo"].astype(str).str[4:6].astype(int))
            .groupby("mes")
            .size()
            .reindex(range(1, 13), fill_value=0)
            .reset_index(name="value")
        )
        return [
            {"name": _MES_LABELS[int(row["mes"]) - 1], "value": int(row["value"])}
            for _, row in monthly.iterrows()
        ]
    except Exception:
        return []


def _fallback() -> dict:
    """Datos de demostración cuando el DW no está cargado."""
    return {
        "kpis": {
            "total_clients": 0, "churn_rate": 0.0, "arpu_avg": 0.0,
            "high_risk": 0, "medium_risk": 0, "low_risk": 0,
            "active_clients": 0, "churned_clients": 0,
        },
        "churn_by_segment": [],
        "churn_by_dept":    [],
        "monthly_trend":    [],
    }
