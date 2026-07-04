"""
service_chat.py — BI Assistant Router
Detecta la intención del usuario y despacha a la herramienta BI correspondiente.
Sin frameworks externos. Solo Python + servicios del proyecto.
"""

import re
from app.services.bi_tools import (
    tool_kpi_summary,
    tool_high_risk_analysis,
    tool_segment_comparison,
    tool_dept_comparison,
    tool_analyze_client,
    tool_explain_model,
    tool_simulate,
    tool_recommendation,
    tool_trend_analysis,
)

_DEPT_KEYWORDS = [
    "lima", "arequipa", "piura", "cusco", "junín", "la libertad",
    "lambayeque", "loreto", "puno", "san martín", "tacna", "cajamarca",
    "tumbes", "ucayali", "áncash", "callao",
]

_SEGMENT_KEYWORDS = ["residencial", "corporativo", "pyme", "segmento"]


def _detect_intent(msg: str) -> str:
    m = msg.lower()

    # Cliente específico — prioridad máxima
    if re.search(r"cli[-\s]?\d+", m):
        return "cliente"

    # Simulación
    if any(k in m for k in ["qué ocurriría", "qué pasaría", "si reducimos", "si aumentamos",
                              "si mejoramos", "simula", "impacto de"]):
        return "simular"

    # Modelo / variables
    if any(k in m for k in ["variable", "influyen", "importancia", "explica el modelo",
                              "cómo predice", "cómo funciona el modelo", "xgboost"]):
        return "modelo"

    # Recomendaciones / estrategia
    if any(k in m for k in ["recomend", "campaña", "estrategia", "qué harías",
                              "qué kpi", "mejorar primero", "acción", "plan"]):
        return "recomendacion"

    # Tendencias
    if any(k in m for k in ["tendencia", "evolución", "mensual", "histórico", "mes a mes"]):
        return "tendencias"

    # Riesgo alto específico
    if any(k in m for k in ["riesgo alto", "atención inmediata", "cuántos tienen riesgo",
                              "clientes en riesgo", "clientes críticos"]):
        return "riesgo_alto"

    # Comparativa por departamento
    if any(k in m for k in _DEPT_KEYWORDS + ["departamento", "región", "compara"]):
        return "departamento"

    # Comparativa por segmento
    if any(k in m for k in _SEGMENT_KEYWORDS):
        return "segmento"

    # KPIs generales / estado del negocio
    if any(k in m for k in ["estado del negocio", "resumen", "panorama", "kpi", "indicador",
                              "cómo está", "arpu", "ingreso", "churn rate", "tasa de", "bajas"]):
        return "kpi"

    return "general"


def _extract_client_id(msg: str) -> str:
    match = re.search(r"(cli[-\s]?\d+)", msg.lower())
    if match:
        raw = match.group(1).replace(" ", "").upper()
        # normalizar a CLI-XXXX
        digits = re.sub(r"\D", "", raw)
        return f"CLI-{digits.zfill(4)}"
    return ""


def _extract_dept_focus(msg: str) -> str:
    m = msg.lower()
    for dept in _DEPT_KEYWORDS:
        if dept in m:
            return dept.title()
    return ""


_GENERAL_RESPONSES: dict[str, str] = {
    "churn":      "El Churn es la tasa de abandono de clientes. Puedes preguntarme: '¿cuántos clientes tienen riesgo alto?' o 'Resume el estado del negocio'.",
    "arpu":       "El ARPU (Average Revenue Per User) es el ingreso promedio por cliente activo. Pregúntame: '¿Cuál es el ARPU promedio?' para ver el valor actual.",
    "mttr":       "El MTTR mide el tiempo promedio en resolver averías. Es una de las variables más importantes del modelo. Prueba: '¿Qué ocurriría si reducimos el MTTR?'",
    "ayuda":      "Puedo ayudarte a:\n• Analizar KPIs del negocio\n• Comparar segmentos o departamentos\n• Analizar un cliente específico (ej: 'Analiza el cliente CLI-0042')\n• Ejecutar simulaciones\n• Explicar el modelo IA\n• Generar recomendaciones estratégicas",
}

_DEFAULT = (
    "No entendí tu consulta. Puedo ayudarte con:\n"
    "• Estado del negocio y KPIs\n"
    "• Clientes en riesgo alto\n"
    "• Comparar segmentos o departamentos\n"
    "• Analizar un cliente: 'Analiza el cliente CLI-0042'\n"
    "• Simulaciones: '¿Qué ocurriría si reducimos el MTTR?'\n"
    "• Recomendaciones estratégicas\n"
    "• Variables del modelo XGBoost"
)


def get_chat_reply(message: str) -> str:
    intent = _detect_intent(message)

    if intent == "cliente":
        client_id = _extract_client_id(message)
        return tool_analyze_client(client_id) if client_id else "No detecté un ID de cliente. Usa el formato CLI-0001."

    if intent == "simular":
        return tool_simulate(message)

    if intent == "modelo":
        return tool_explain_model()

    if intent == "recomendacion":
        return tool_recommendation()

    if intent == "tendencias":
        return tool_trend_analysis()

    if intent == "riesgo_alto":
        return tool_high_risk_analysis()

    if intent == "departamento":
        focus = _extract_dept_focus(message)
        return tool_dept_comparison(focus)

    if intent == "segmento":
        return tool_segment_comparison()

    if intent == "kpi":
        return tool_kpi_summary()

    # Fallback: check for basic FAQ keywords before default
    msg_lower = message.lower()
    for keyword, response in _GENERAL_RESPONSES.items():
        if keyword in msg_lower:
            return response

    return _DEFAULT
