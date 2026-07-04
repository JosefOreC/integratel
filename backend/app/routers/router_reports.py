from fastapi import APIRouter
from fastapi.responses import StreamingResponse, Response
from app.services.service_reports import generate_csv, generate_excel

router = APIRouter()


@router.get("/reports/export/csv")
def export_csv():
    content = generate_csv()
    return Response(
        content=content.encode("utf-8-sig"),   # utf-8-sig para compatibilidad con Excel
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=clientes_integratel.csv"},
    )


@router.get("/reports/export/excel")
def export_excel():
    content = generate_excel()
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=clientes_integratel.xlsx"},
    )
