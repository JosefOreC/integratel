from fastapi import APIRouter, HTTPException
from app.schemas.schemas import PredictInput
from app.ml.predictor import run_prediction, get_valid_options

router = APIRouter()


@router.post("/predict")
def predict(payload: PredictInput):
    try:
        result = run_prediction(**payload.model_dump())
        return {"status": "ok", "message": "Predicción completada", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/predict/options")
def predict_options():
    return {"status": "ok", "message": "Opciones válidas", "data": get_valid_options()}
