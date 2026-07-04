from fastapi import APIRouter, HTTPException
from typing import Optional
from app.services.service_clients import get_clients, get_client_by_id

router = APIRouter()


@router.get("/clients")
def clients(
    search: Optional[str] = None,
    segmento: Optional[str] = None,
    departamento: Optional[str] = None,
):
    data = get_clients(search=search, segmento=segmento, departamento=departamento)
    return {"status": "ok", "message": f"{len(data)} clientes", "data": data}


@router.get("/clients/{client_id}")
def client_detail(client_id: str):
    client = get_client_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"status": "ok", "message": "Cliente encontrado", "data": client}
