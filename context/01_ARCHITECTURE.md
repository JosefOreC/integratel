# Arquitectura

## Stack

Frontend

- React
- Vite
- TypeScript
- TailwindCSS
- shadcn/ui
- Axios

Backend

- FastAPI
- Python

Base de datos

- PostgreSQL (Supabase)

Modelo IA

- XGBoost existente

Hosting

- Vercel
- Render
- Supabase

---

## Flujo

React

↓

FastAPI

↓

Modelo XGBoost

↓

Respuesta JSON

↓

React

---

## Backend

app/

routers/

services/

schemas/

ml/

database.py

models.py

main.py

---

## Frontend

src/

pages/

components/

layouts/

services/

types/

assets/

---

## Reglas

Frontend nunca accede directamente a PostgreSQL.

React nunca ejecuta el modelo.

FastAPI centraliza toda la lógica.

El modelo se carga una única vez.

No usar microservicios.

No usar Docker.

No usar Kubernetes.

Mantener arquitectura simple.
