from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import router_dashboard, router_clients, router_predict, router_chat, router_reports
from app.ml.predictor import load_model
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load model once
    model_path = Path(__file__).parent / "ml" / "model.joblib"
    if model_path.exists():
        load_model()
        print("[SUCCESS] Modelo XGBoost cargado correctamente.")
    else:
        print("[WARNING] model.joblib no encontrado. Endpoint /predict no disponible.")
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
