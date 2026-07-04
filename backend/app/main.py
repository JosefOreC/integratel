from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import router_dashboard, router_clients, router_predict, router_chat, router_reports
from app.ml.predictor import load_model
from app.services import service_data
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Cargar modelo XGBoost ──────────────────────────────────────
    model_path = Path(__file__).parent / "ml" / "model.joblib"
    if model_path.exists():
        load_model()
        print("[SUCCESS] Modelo XGBoost cargado correctamente.")
    else:
        print("[WARNING] model.joblib no encontrado. Endpoint /predict no disponible.")

    # ── Cargar Data Warehouse ──────────────────────────────────────
    result = service_data.load_dw()
    if result["status"] == "ok":
        print(f"[SUCCESS] DW cargado: {result['df_model_rows']:,} clientes | churn rate: {result['churn_rate']}%")
    else:
        print(f"[WARNING] DW no cargado: {result.get('message', 'error desconocido')}")

    yield


app = FastAPI(
    title="Integratel BI+AI API",
    description="Backend para el MVP de análisis de churn de Integratel Perú.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_dashboard.router)
app.include_router(router_clients.router)
app.include_router(router_predict.router)
app.include_router(router_chat.router)
app.include_router(router_reports.router)


@app.get("/health")
def health():
    return {"status": "ok", "message": "Integratel BI+AI API running"}
