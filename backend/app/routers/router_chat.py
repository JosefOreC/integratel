from fastapi import APIRouter
from app.schemas.schemas import ChatInput
from app.services.service_chat import get_chat_reply

router = APIRouter()


@router.post("/chat")
def chat(payload: ChatInput):
    reply = get_chat_reply(payload.message)
    return {"status": "ok", "message": "Respuesta generada", "data": {"reply": reply}}
