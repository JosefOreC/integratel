# Backend

## Objetivo

Toda la lógica del sistema vive aquí.

## Responsabilidades

Routers

Reciben peticiones.

Services

Procesan lógica.

Schemas

Validan datos.

ML

Ejecuta predicciones.

Database

Conexión PostgreSQL.

## API

GET /dashboard

GET /clients

GET /clients/{id}

POST /predict

GET /reports

POST /chat

## Reglas

No SQL en routers.

No lógica en schemas.

No cargar el modelo por request.

No entrenar modelos.

Siempre responder JSON.

## Respuesta

status

message

data

## Errores

400

401

404

500

## Seguridad

Validación mediante Pydantic.

Variables en .env.

No hardcodear credenciales.
