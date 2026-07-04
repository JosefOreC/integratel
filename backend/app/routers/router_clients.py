"""
router_clients.py
=================
Endpoints para la gestión de clientes e importación del DW.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
from app.services.service_clients import get_clients, get_client_by_id, import_dw_from_excel

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


@router.post("/clients/import")
async def import_dw(file: UploadFile = File(...)):
    """
    Importa el Data Warehouse completo desde un archivo Excel.
    El archivo debe tener las hojas: DIM_CLIENTE, FACT_FACTURACION,
    FACT_AVERIAS, FACT_CHURN, FACT_USO_RED, DIM_TIEMPO, etc.
    """
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Use .xlsx o .xls"
        )

    contents = await file.read()
    res = import_dw_from_excel(contents)

    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))

    return {
        "status": "ok",
        "message": f"DW importado: {res['df_model_rows']:,} clientes analíticos",
        "data": res,
    }
