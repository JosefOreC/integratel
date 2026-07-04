from fastapi import APIRouter
from app.services.service_dashboard import get_dashboard_data

router = APIRouter()


@router.get("/dashboard")
def dashboard():
    data = get_dashboard_data()
    return {"status": "ok", "message": "Dashboard data", "data": data}
