"""
service_clients.py
Returns client list and detail.
Uses simulated data for MVP demo.
"""

import random
from typing import Optional

SEGMENTOS    = ["Corporativo", "PYME", "Residencial"]
DEPARTAMENTOS = ["Lima", "Arequipa", "La Libertad", "Piura", "Cusco", "Junín", "Callao"]
ESTADOS       = ["Activo", "Suspendido", "Baja"]

random.seed(42)

_CLIENTS = [
    {
        "id_cliente":       f"CLI-{str(i).zfill(4)}",
        "nombre":           f"Cliente {i}",
        "segmento":         random.choice(SEGMENTOS),
        "departamento":     random.choice(DEPARTAMENTOS),
        "antiguedad_meses": random.randint(3, 120),
        "arpu":             round(random.uniform(80, 400), 2),
        "churn":            1 if random.random() < 0.12 else 0,
        "estado":           random.choices(ESTADOS, weights=[75, 15, 10])[0],
    }
    for i in range(1, 201)
]


def get_clients(
    search: Optional[str] = None,
    segmento: Optional[str] = None,
    departamento: Optional[str] = None,
) -> list[dict]:
    result = _CLIENTS.copy()

    if search:
        s = search.lower()
        result = [c for c in result if s in c["id_cliente"].lower() or s in c["nombre"].lower()]

    if segmento:
        result = [c for c in result if c["segmento"] == segmento]

    if departamento:
        result = [c for c in result if c["departamento"] == departamento]

    return result


def get_client_by_id(client_id: str) -> Optional[dict]:
    return next((c for c in _CLIENTS if c["id_cliente"] == client_id), None)
