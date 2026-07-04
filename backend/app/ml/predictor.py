"""
predictor.py
Reinterpretación de c2_sem_15_in.py para uso en FastAPI.

El modelo XGBoost fue entrenado en el notebook de Colab con:
  - features en orden exacto: features list
  - LabelEncoders: le_seg (segmento), le_dep (departamento)
  - threshold: 0.60

Este módulo carga el modelo UNA VEZ al iniciar FastAPI (startup).
No entrena, no modifica encoders.
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path

# ─────────────────────────────────────────────────────────────────
# CONSTANTES — deben coincidir exactamente con el entrenamiento
# ─────────────────────────────────────────────────────────────────

THRESHOLD = 0.60

# Orden exacto de features tal como aparece en el notebook
FEATURES = [
    "antiguedad_meses",
    "num_reclamos",
    "mttr_prom",
    "sat_media",
    "total_averias",
    "arpu",
    "pct_venc",
    "deuda_promedio",
    "max_dias_atraso",
    "seg_enc",
    "dep_enc",
]

# Clases del LabelEncoder — deben ser IDÉNTICAS al fit() del notebook
# (orden alfabético, que es el comportamiento de LabelEncoder)
# Clases exactas tal como las produjo LabelEncoder durante el entrenamiento real
SEGMENTOS = ["Corporativo", "PYME", "Residencial"]
DEPARTAMENTOS = [
    "Arequipa", "Cajamarca", "Cusco", "Ica", "Jun\u00edn",
    "La Libertad", "Lambayeque", "Lima", "Loreto", "Piura",
    "Puno", "San Mart\u00edn", "Tacna", "Tumbes", "Ucayali", "\u00c1ncash",
]

MODEL_PATH = Path(__file__).parent / "model.joblib"

# Objeto global — se carga en startup
_model = None


def load_model() -> None:
    """Carga el modelo desde disco. Llamar una sola vez en startup."""
    global _model
    _model = joblib.load(MODEL_PATH)


def _encode_segmento(segmento: str) -> int:
    """Codifica segmento de la misma forma que LabelEncoder.fit(SEGMENTOS)."""
    seg_sorted = sorted(SEGMENTOS)
    if segmento not in seg_sorted:
        raise ValueError(f"Segmento '{segmento}' no válido. Opciones: {seg_sorted}")
    return seg_sorted.index(segmento)


def _encode_departamento(departamento: str) -> int:
    """Codifica departamento de la misma forma que LabelEncoder.fit(DEPARTAMENTOS)."""
    dep_sorted = sorted(DEPARTAMENTOS)
    if departamento not in dep_sorted:
        raise ValueError(f"Departamento '{departamento}' no válido. Opciones: {dep_sorted}")
    return dep_sorted.index(departamento)


def _get_risk(prob: float) -> str:
    """Replica la lógica de riesgo del notebook."""
    if prob >= 0.70:
        return "ALTO"
    elif prob >= 0.40:
        return "MEDIO"
    return "BAJO"


def _get_factors(
    num_reclamos: float,
    mttr_prom: float,
    sat_media: float,
    pct_venc: float,
    total_averias: float,
) -> list[str]:
    """Replica la lógica de factores del simulador interactivo del notebook."""
    factors: list[str] = []
    if num_reclamos >= 5:
        factors.append("Muchos reclamos")
    if mttr_prom >= 300:
        factors.append("MTTR alto")
    if sat_media <= 3:
        factors.append("Baja satisfacción")
    if pct_venc >= 50:
        factors.append("Alta morosidad")
    if total_averias >= 5:
        factors.append("Muchas averías")
    return factors


def _get_recommendation(prob: float) -> str:
    """Replica la lógica de recomendación del notebook."""
    if prob >= 0.70:
        return "Acción inmediata de retención"
    elif prob >= 0.40:
        return "Monitoreo preventivo"
    return "Cliente estable"


def run_prediction(
    antiguedad_meses: float,
    num_reclamos: float,
    mttr_prom: float,
    sat_media: float,
    total_averias: float,
    arpu: float,
    pct_venc: float,
    deuda_promedio: float,
    max_dias_atraso: float,
    segmento: str,
    departamento: str,
) -> dict:
    """
    Ejecuta la predicción de churn.
    Retorna dict con: probability, prediction, risk, recommendation, factors.
    """
    if _model is None:
        raise RuntimeError("Modelo no cargado. Llamar load_model() en startup.")

    seg_enc = _encode_segmento(segmento)
    dep_enc = _encode_departamento(departamento)

    # Construir DataFrame con el mismo orden de columnas del entrenamiento
    cliente = pd.DataFrame([{
        "antiguedad_meses": antiguedad_meses,
        "num_reclamos":     num_reclamos,
        "mttr_prom":        min(max(mttr_prom, 0), 500),   # clip igual al notebook
        "sat_media":        sat_media,
        "total_averias":    total_averias,
        "arpu":             arpu,
        "pct_venc":         min(max(pct_venc, 0), 100),    # clip igual al notebook
        "deuda_promedio":   deuda_promedio,
        "max_dias_atraso":  max_dias_atraso,
        "seg_enc":          seg_enc,
        "dep_enc":          dep_enc,
    }])[FEATURES]

    prob: float = float(_model.predict_proba(cliente)[0][1])
    pred: int   = int(prob >= THRESHOLD)

    return {
        "probability":    round(prob, 4),
        "prediction":     pred,
        "risk":           _get_risk(prob),
        "recommendation": _get_recommendation(prob),
        "factors":        _get_factors(num_reclamos, mttr_prom, sat_media, pct_venc, total_averias),
    }


def get_valid_options() -> dict:
    """Retorna las opciones válidas para el formulario del frontend."""
    return {
        "segmentos":     sorted(SEGMENTOS),
        "departamentos": sorted(DEPARTAMENTOS),
    }


def get_feature_importances() -> list[dict]:
    """Retorna la importancia de cada variable del modelo XGBoost (datos reales)."""
    if _model is None:
        return []
    labels = [
        "Antigüedad (meses)", "N° Reclamos", "MTTR promedio",
        "Satisfacción", "Total averías", "ARPU", "% Facturas vencidas",
        "Deuda promedio", "Días de atraso", "Segmento", "Departamento",
    ]
    importances = [round(float(v) * 100, 1) for v in _model.feature_importances_]
    ranked = sorted(
        [{"feature": l, "importance": i} for l, i in zip(labels, importances)],
        key=lambda x: x["importance"],
        reverse=True,
    )
    return ranked
