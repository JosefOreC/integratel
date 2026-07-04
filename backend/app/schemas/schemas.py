from pydantic import BaseModel, Field


class PredictInput(BaseModel):
    antiguedad_meses: float = Field(..., ge=0, description="Antigüedad en meses")
    num_reclamos:     float = Field(..., ge=0)
    mttr_prom:        float = Field(..., ge=0)
    sat_media:        float = Field(..., ge=1, le=10)
    total_averias:    float = Field(..., ge=0)
    arpu:             float = Field(..., ge=0)
    pct_venc:         float = Field(..., ge=0, le=100)
    deuda_promedio:   float = Field(..., ge=0)
    max_dias_atraso:  float = Field(..., ge=0)
    segmento:         str
    departamento:     str


class PredictResult(BaseModel):
    probability:    float
    prediction:     int
    risk:           str
    recommendation: str
    factors:        list[str]


class ChatInput(BaseModel):
    message: str = Field(..., min_length=1)
