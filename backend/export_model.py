"""
export_model.py
─────────────────────────────────────────────────────────────────
Script para generar model.joblib desde los datos del Data Warehouse.

USO:
  1. Coloca el archivo Excel del DW en la misma carpeta que este script.
  2. Actualiza la variable EXCEL_PATH con el nombre del archivo.
  3. Ejecuta: python export_model.py
  4. El archivo model.joblib se generará en backend/app/ml/

IMPORTANTE:
  Este script replica EXACTAMENTE el entrenamiento del notebook c2_sem_15_in.py
  (Colab) para garantizar que predictor.py sea compatible con el modelo exportado.
─────────────────────────────────────────────────────────────────
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

# ─── Configuración ──────────────────────────────────────────────
EXCEL_PATH = Path("D:\DESARROLLO_APLICACIONES\Python\in//backend\Integratel_dw.xlsx")          # ← actualiza si el nombre difiere
OUTPUT_PATH = Path(__file__).parent / "app" / "ml" / "model.joblib"
# ────────────────────────────────────────────────────────────────


def load_dw(path: Path) -> dict:
    xl = pd.ExcelFile(path)
    return {
        "dim_cliente":   pd.read_excel(xl, "DIM_CLIENTE"),
        "fact_av":       pd.read_excel(xl, "FACT_AVERIAS"),
        "fact_fact":     pd.read_excel(xl, "FACT_FACTURACION"),
    }


def build_dataset(tables: dict) -> pd.DataFrame:
    dim_cliente = tables["dim_cliente"]
    fact_av     = tables["fact_av"]
    fact_fact   = tables["fact_fact"]

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

    df = (
        dim_cliente[["id_cliente", "segmento", "departamento", "antiguedad_meses"]]
        .merge(av_cl, on="id_cliente", how="left")
        .merge(ff_cl, on="id_cliente", how="left")
    )

    # Variable objetivo — igual que en el notebook
    df["churn"] = (
        dim_cliente
        .set_index("id_cliente")["estado_actual"]
        .map({"Baja": 1, "Activo": 0, "Suspendido": 0})
        .values
    )

    df = df.dropna(subset=["churn"])
    df = df.fillna(0)
    df["mttr_prom"] = df["mttr_prom"].clip(0, 500)
    df["pct_venc"]  = df["pct_venc"].clip(0, 100)

    return df


def train(df: pd.DataFrame):
    le_seg = LabelEncoder()
    le_dep = LabelEncoder()

    df["seg_enc"] = le_seg.fit_transform(df["segmento"])
    df["dep_enc"] = le_dep.fit_transform(df["departamento"])

    print("Clases segmento:     ", list(le_seg.classes_))
    print("Clases departamento: ", list(le_dep.classes_))

    features = [
        "antiguedad_meses", "num_reclamos", "mttr_prom", "sat_media",
        "total_averias", "arpu", "pct_venc", "deuda_promedio",
        "max_dias_atraso", "seg_enc", "dep_enc",
    ]

    X = df[features]
    y = df["churn"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

    clf = XGBClassifier(
        objective="binary:logistic",
        eval_metric="auc",
        n_estimators=120,
        max_depth=3,
        learning_rate=0.03,
        subsample=0.70,
        colsample_bytree=0.70,
        reg_alpha=2,
        reg_lambda=4,
        min_child_weight=8,
        gamma=1,
        random_state=42,
    )

    clf.fit(X_train_res, y_train_res)

    return clf, le_seg, le_dep


def main():
    if not EXCEL_PATH.exists():
        print(f"❌ No se encontró el archivo: {EXCEL_PATH}")
        print("   Actualiza la variable EXCEL_PATH en este script.")
        sys.exit(1)

    print("📂 Cargando Data Warehouse...")
    tables = load_dw(EXCEL_PATH)

    print("🔧 Construyendo dataset...")
    df = build_dataset(tables)
    print(f"   Total clientes: {len(df)}")
    print(f"   Tasa de churn:  {df['churn'].mean() * 100:.1f}%")

    print("🤖 Entrenando modelo XGBoost...")
    clf, le_seg, le_dep = train(df)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, OUTPUT_PATH)
    print(f"✅ Modelo guardado en: {OUTPUT_PATH}")

    # Guardar clases para verificación
    print("\n⚠️  IMPORTANTE: Actualiza SEGMENTOS y DEPARTAMENTOS en predictor.py si difieren:")
    print("   SEGMENTOS    =", list(le_seg.classes_))
    print("   DEPARTAMENTOS =", list(le_dep.classes_))


if __name__ == "__main__":
    main()
