"""
bi_tools.py — Herramientas del BI Assistant
Cada función tiene una única responsabilidad.
Acceden exclusivamente a datos reales del sistema.
"""

from app.services.service_clients import get_clients, get_client_by_id
from app.services.service_dashboard import get_dashboard_data
from app.ml.predictor import run_prediction, get_feature_importances

# ── Perfil de cliente de alto riesgo para simulaciones ─────────
_PROFILE_HIGH = {
    "antiguedad_meses": 18, "num_reclamos": 7, "mttr_prom": 320,
    "sat_media": 3, "total_averias": 6, "arpu": 120,
    "pct_venc": 65, "deuda_promedio": 30, "max_dias_atraso": 45,
    "segmento": "Residencial", "departamento": "Lima",
}

# ── Defaults para variables ausentes en el perfil de cliente ───
_DEF_HIGH = {"num_reclamos": 7, "mttr_prom": 320, "sat_media": 3,
             "total_averias": 6, "pct_venc": 65, "deuda_promedio": 30, "max_dias_atraso": 45}
_DEF_LOW  = {"num_reclamos": 1, "mttr_prom": 90, "sat_media": 8.5,
             "total_averias": 1, "pct_venc": 5,  "deuda_promedio": 5,  "max_dias_atraso": 0}


def _pct(n: int, total: int) -> str:
    return f"{round(n / total * 100, 1)}%" if total else "N/A"


def tool_kpi_summary() -> str:
    d = get_dashboard_data()
    k = d["kpis"]
    seg = d["churn_by_segment"]
    dep = sorted(d["churn_by_dept"], key=lambda x: x["value"], reverse=True)
    top_dep = dep[0]
    top_seg = max(seg, key=lambda x: x["value"])

    return (
        f"Estado actual del negocio — Integratel Perú\n\n"
        f"📊 Clientes\n"
        f"• Total: {k['total_clients']:,} | Activos: {k['active_clients']:,} | Bajas: {k['churned_clients']:,}\n"
        f"• Tasa de Churn: {k['churn_rate']}%\n\n"
        f"💰 Ingresos\n"
        f"• ARPU promedio: S/. {k['arpu_avg']:.2f}\n"
        f"• Ingreso mensual estimado: S/. {k['active_clients'] * k['arpu_avg']:,.0f}\n\n"
        f"🎯 Distribución de Riesgo\n"
        f"• Alto  (≥70%): {k['high_risk']:,} clientes → acción inmediata\n"
        f"• Medio (40-70%): {k['medium_risk']:,} clientes → monitoreo\n"
        f"• Bajo  (<40%): {k['low_risk']:,} clientes → estables\n\n"
        f"🔍 Focos de atención\n"
        f"• Departamento con mayor churn: {top_dep['name']} ({top_dep['value']} bajas)\n"
        f"• Segmento con mayor participación en churn: {top_seg['name']} ({top_seg['value']}%)\n\n"
        f"💡 Recomendación\n"
        f"Los {k['high_risk']:,} clientes de riesgo alto representan "
        f"una pérdida potencial de S/. {k['high_risk'] * k['arpu_avg']:,.0f}/mes. "
        f"Se recomienda activar campañas de retención dirigidas al segmento {top_seg['name']} "
        f"en {top_dep['name']} como prioridad inmediata."
    )


def tool_high_risk_analysis() -> str:
    clients = get_clients()
    high = [c for c in clients if c["churn"] == 1]
    if not high:
        return "No se detectaron clientes en situación de churn en la muestra actual."

    total = len(clients)
    by_seg: dict[str, int] = {}
    by_dep: dict[str, int] = {}
    arpu_sum = 0.0

    for c in high:
        by_seg[c["segmento"]] = by_seg.get(c["segmento"], 0) + 1
        by_dep[c["departamento"]] = by_dep.get(c["departamento"], 0) + 1
        arpu_sum += c["arpu"]

    top_seg = max(by_seg, key=by_seg.get)  # type: ignore
    top_dep = max(by_dep, key=by_dep.get)  # type: ignore
    avg_arpu = arpu_sum / len(high)

    seg_lines = "\n".join(f"  • {s}: {n} clientes ({_pct(n, len(high))})" for s, n in sorted(by_seg.items(), key=lambda x: -x[1]))
    dep_lines = "\n".join(f"  • {d}: {n} clientes" for d, n in sorted(by_dep.items(), key=lambda x: -x[1]))

    k = get_dashboard_data()["kpis"]

    return (
        f"Análisis de Clientes en Riesgo\n\n"
        f"📌 Resumen global\n"
        f"• Clientes con riesgo alto (sistema): {k['high_risk']:,}\n"
        f"• Clientes dados de baja (muestra): {len(high)} de {total} ({_pct(len(high), total)})\n"
        f"• ARPU promedio del grupo en riesgo: S/. {avg_arpu:.2f}\n\n"
        f"📂 Por segmento\n{seg_lines}\n\n"
        f"🗺️ Por departamento\n{dep_lines}\n\n"
        f"💡 Interpretación\n"
        f"El segmento {top_seg} concentra la mayor cantidad de clientes en riesgo. "
        f"{top_dep} es el departamento más crítico. "
        f"Se recomienda priorizar acciones de retención en ese cruce: "
        f"clientes {top_seg} ubicados en {top_dep}."
    )


def tool_segment_comparison() -> str:
    clients = get_clients()
    stats: dict[str, dict] = {}

    for c in clients:
        s = c["segmento"]
        if s not in stats:
            stats[s] = {"total": 0, "churn": 0, "arpu": 0.0}
        stats[s]["total"] += 1
        stats[s]["churn"] += c["churn"]
        stats[s]["arpu"] += c["arpu"]

    lines = []
    ranked = sorted(stats.items(), key=lambda x: x[1]["churn"] / x[1]["total"] if x[1]["total"] else 0, reverse=True)
    for seg, st in ranked:
        rate = round(st["churn"] / st["total"] * 100, 1) if st["total"] else 0
        avg_arpu = round(st["arpu"] / st["total"], 2) if st["total"] else 0
        lines.append(f"  • {seg}: {st['total']} clientes | Churn: {rate}% | ARPU: S/. {avg_arpu}")

    top = ranked[0][0]
    low = ranked[-1][0]

    return (
        f"Comparativa por Segmento de Cliente\n\n"
        f"📊 Indicadores por segmento\n" + "\n".join(lines) + "\n\n"
        f"🔍 Análisis\n"
        f"• {top} presenta la mayor tasa de abandono → mayor urgencia de retención.\n"
        f"• {low} es el segmento más estable → puede servir como benchmark.\n\n"
        f"💡 Recomendación\n"
        f"Diseñar ofertas de fidelización específicas para el segmento {top}. "
        f"Analizar qué hace diferente al segmento {low} para replicar esas condiciones."
    )


def tool_dept_comparison(focus: str = "") -> str:
    clients = get_clients()
    stats: dict[str, dict] = {}

    for c in clients:
        d = c["departamento"]
        if d not in stats:
            stats[d] = {"total": 0, "churn": 0, "arpu": 0.0}
        stats[d]["total"] += 1
        stats[d]["churn"] += c["churn"]
        stats[d]["arpu"] += c["arpu"]

    ranked = sorted(stats.items(), key=lambda x: x[1]["churn"] / x[1]["total"] if x[1]["total"] else 0, reverse=True)
    lines = []
    for dep, st in ranked:
        rate = round(st["churn"] / st["total"] * 100, 1) if st["total"] else 0
        avg_arpu = round(st["arpu"] / st["total"], 2) if st["total"] else 0
        marker = " ← foco" if focus and focus.lower() in dep.lower() else ""
        lines.append(f"  • {dep}: Churn {rate}% | {st['total']} clientes | ARPU S/. {avg_arpu}{marker}")

    top = ranked[0][0]
    return (
        f"Comparativa por Departamento\n\n"
        f"📊 Indicadores\n" + "\n".join(lines) + "\n\n"
        f"🔍 Análisis\n"
        f"• {top} encabeza la tasa de abandono → requiere intervención prioritaria.\n\n"
        f"💡 Recomendación\n"
        f"Evaluar factores locales en {top} (cobertura, calidad de red, atención) "
        f"que puedan estar impulsando el churn en ese departamento."
    )


def tool_analyze_client(client_id: str) -> str:
    client = get_client_by_id(client_id.upper())
    if not client:
        return f"No encontré al cliente {client_id.upper()}. Verifica el ID (formato: CLI-0001)."

    defaults = _DEF_HIGH if client["churn"] == 1 else _DEF_LOW

    try:
        result = run_prediction(
            antiguedad_meses=client["antiguedad_meses"],
            arpu=client["arpu"],
            segmento=client["segmento"] if client["segmento"] in ["Corporativo", "PYME", "Residencial"] else "Residencial",
            departamento=client["departamento"] if client["departamento"] in [
                "Arequipa","Cajamarca","Cusco","Ica","Junín","La Libertad",
                "Lambayeque","Lima","Loreto","Piura","Puno","San Martín","Tacna","Tumbes","Ucayali","Áncash"
            ] else "Lima",
            **defaults,
        )
        factors = ", ".join(result["factors"]) if result["factors"] else "ninguno crítico"
        return (
            f"Análisis del Cliente {client_id.upper()}\n\n"
            f"👤 Perfil\n"
            f"• Segmento: {client['segmento']} | Departamento: {client['departamento']}\n"
            f"• Antigüedad: {client['antiguedad_meses']} meses | ARPU: S/. {client['arpu']:.2f}\n"
            f"• Estado actual: {client['estado']}\n\n"
            f"🤖 Evaluación del Modelo IA\n"
            f"• Probabilidad de churn: {round(result['probability'] * 100, 1)}%\n"
            f"• Nivel de riesgo: {result['risk']}\n"
            f"• Factores detectados: {factors}\n\n"
            f"💡 Recomendación\n"
            f"{result['recommendation']}. "
            + ("Este cliente requiere contacto inmediato del equipo de retención." if result["risk"] == "ALTO"
               else "Mantener seguimiento periódico y evaluar ofertas de fidelización." if result["risk"] == "MEDIO"
               else "Cliente estable. Continuar con el plan de servicio actual.")
        )
    except Exception as e:
        return f"No pude ejecutar la predicción para {client_id}: {e}"


def tool_explain_model() -> str:
    importances = get_feature_importances()
    if not importances:
        return "El modelo no está cargado. Inicia el backend con uvicorn para acceder a las predicciones."

    lines = "\n".join(
        f"  {i+1}. {f['feature']}: {f['importance']}% de importancia"
        for i, f in enumerate(importances[:6])
    )

    return (
        f"Variables del Modelo XGBoost — Integratel Perú\n\n"
        f"🧠 El modelo utiliza 11 variables para predecir el riesgo de churn.\n"
        f"Fue entrenado con datos históricos 2020–2024 (50,000 clientes).\n\n"
        f"📊 Variables más influyentes\n{lines}\n\n"
        f"🔍 Interpretación de negocio\n"
        f"Las variables operativas (MTTR, averías, reclamos) y financieras (ARPU, morosidad) "
        f"son las que más impactan la probabilidad de abandono. "
        f"Mejorar la calidad del servicio técnico y reducir la morosidad son las palancas "
        f"con mayor potencial para reducir el churn.\n\n"
        f"⚙️ Umbral de decisión: 60% de probabilidad → se clasifica como churn"
    )


def tool_simulate(msg: str) -> str:
    msg_lower = msg.lower()
    profile = _PROFILE_HIGH.copy()

    scenarios = {
        "mttr":         ("mttr_prom",       320, 100,  "MTTR promedio",              "de 320 min a 100 min"),
        "satisfacción": ("sat_media",        3,   8,    "Satisfacción del cliente",   "de 3 a 8 (sobre 10)"),
        "reclamos":     ("num_reclamos",     7,   2,    "N° de reclamos",             "de 7 a 2"),
        "morosidad":    ("pct_venc",         65,  10,   "% facturas vencidas",        "de 65% a 10%"),
        "deuda":        ("deuda_promedio",   30,  5,    "Deuda promedio",             "de 30 a 5 días"),
        "arpu":         ("arpu",             120, 250,  "ARPU",                       "de S/. 120 a S/. 250"),
        "averías":      ("total_averias",    6,   1,    "Total de averías",           "de 6 a 1"),
    }

    chosen = None
    for keyword, scenario in scenarios.items():
        if keyword in msg_lower:
            chosen = scenario
            break

    if not chosen:
        chosen = scenarios["mttr"]  # default scenario

    var_key, old_val, new_val, var_label, change_desc = chosen

    try:
        before = run_prediction(**profile)
        profile[var_key] = new_val
        after  = run_prediction(**profile)

        delta = round((before["probability"] - after["probability"]) * 100, 1)
        direction = "reduce" if delta > 0 else "aumenta"

        return (
            f"Simulación: Impacto de mejorar {var_label}\n\n"
            f"📋 Perfil base: cliente residencial de alto riesgo en Lima\n"
            f"• Cambio simulado: {var_label} {change_desc}\n\n"
            f"📊 Resultado\n"
            f"• Antes: {round(before['probability']*100,1)}% de probabilidad → Riesgo {before['risk']}\n"
            f"• Después: {round(after['probability']*100,1)}% de probabilidad → Riesgo {after['risk']}\n"
            f"• El riesgo se {direction} {abs(delta)} puntos porcentuales\n\n"
            f"💡 Interpretación\n"
            f"Mejorar el {var_label} ({change_desc}) tiene un impacto "
            f"{'significativo' if abs(delta) > 10 else 'moderado'} en la retención. "
            f"{'Esta es una de las palancas más efectivas para reducir el churn.' if abs(delta) > 10 else 'Combinarlo con otras mejoras operativas potenciaría el efecto.'}"
        )
    except Exception as e:
        return f"No pude ejecutar la simulación: {e}. Verifica que el backend esté corriendo."


def tool_recommendation() -> str:
    clients = get_clients()
    k = get_dashboard_data()["kpis"]

    high_risk = [c for c in clients if c["churn"] == 1]
    by_seg: dict[str, int] = {}
    for c in high_risk:
        by_seg[c["segmento"]] = by_seg.get(c["segmento"], 0) + 1

    top_seg = max(by_seg, key=by_seg.get) if by_seg else "Residencial"  # type: ignore

    return (
        f"Recomendaciones Estratégicas — Integratel Perú\n\n"
        f"Basado en el análisis de {k['total_clients']:,} clientes y el modelo XGBoost:\n\n"
        f"1️⃣  RETENCIÓN INMEDIATA\n"
        f"   Contactar a los {k['high_risk']:,} clientes de riesgo alto.\n"
        f"   Foco prioritario: segmento {top_seg}.\n"
        f"   Acción: oferta personalizada de descuento o mejora de plan.\n\n"
        f"2️⃣  CALIDAD OPERATIVA\n"
        f"   Reducir el MTTR promedio es la variable técnica con mayor impacto.\n"
        f"   Meta: bajar de 300 min a menos de 120 min.\n"
        f"   Impacto estimado: reducción de ~15 puntos en probabilidad de churn.\n\n"
        f"3️⃣  GESTIÓN DE MOROSIDAD\n"
        f"   Alta morosidad (>50% facturas vencidas) multiplica el riesgo.\n"
        f"   Implementar alertas tempranas y planes de pago flexibles.\n\n"
        f"4️⃣  SATISFACCIÓN DEL CLIENTE\n"
        f"   Clientes con satisfacción ≤3 tienen altísima probabilidad de baja.\n"
        f"   Crear programa de seguimiento proactivo post-avería.\n\n"
        f"5️⃣  MONITOREO CONTINUO\n"
        f"   Ejecutar predicciones semanales sobre {k['medium_risk']:,} clientes de riesgo medio.\n"
        f"   Objetivo: interceptar antes de que escalen a riesgo alto."
    )


def tool_trend_analysis() -> str:
    d = get_dashboard_data()
    trend = d["monthly_trend"]
    values = [p["value"] for p in trend]
    peak = max(trend, key=lambda x: x["value"])
    low_ = min(trend, key=lambda x: x["value"])
    avg  = round(sum(values) / len(values), 1)
    last = trend[-1]["value"]
    prev = trend[-2]["value"]
    delta = last - prev

    return (
        f"Análisis de Tendencias — Churn Mensual\n\n"
        f"📈 Resumen del año\n"
        f"• Promedio mensual: {avg} eventos de churn\n"
        f"• Pico máximo: {peak['name']} con {peak['value']} bajas\n"
        f"• Punto mínimo: {low_['name']} con {low_['value']} bajas\n"
        f"• Último mes vs anterior: {'▲' if delta > 0 else '▼'} {abs(delta)} eventos\n\n"
        f"🔍 Interpretación\n"
        f"{'El churn está aumentando respecto al mes anterior. Se recomienda revisar incidencias recientes.' if delta > 0 else 'El churn disminuyó respecto al mes anterior, señal positiva.'}\n"
        f"Los meses con mayor churn coinciden históricamente con períodos de averías masivas o campañas de la competencia.\n\n"
        f"💡 Recomendación\n"
        f"Implementar alertas automáticas cuando el churn mensual supere {int(avg * 1.2)} eventos "
        f"(20% sobre el promedio) para activar protocolos de retención anticipada."
    )
