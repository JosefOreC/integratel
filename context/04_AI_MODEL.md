# Modelo IA

## Objetivo

Integrar el modelo existente.

No modificar entrenamiento.

## Algoritmo

XGBoost

## Entradas

- antiguedad_meses
- num_reclamos
- mttr_prom
- sat_media
- total_averias
- arpu
- pct_venc
- deuda_promedio
- max_dias_atraso
- segmento
- departamento

## Salidas

probability

prediction

risk

recommendation

## Flujo

React

↓

POST /predict

↓

FastAPI

↓

predictor.py

↓

model.joblib

↓

Respuesta JSON

## Riesgo

> = 0.70

ALTO

0.40 - 0.69

MEDIO

< 0.40

BAJO

## Restricciones

No reentrenar.

No modificar variables.

No modificar encoders.

No cargar el modelo por petición.

El modelo se carga al iniciar FastAPI.
