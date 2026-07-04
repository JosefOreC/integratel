"""
service_dashboard.py
Returns KPI summary and chart data for the Dashboard page.
Data is simulated for MVP demo — will be replaced with real DB queries.
"""

import random


def get_dashboard_data() -> dict:
    # Simulated KPIs
    total_clients  = 5_200
    churned        = 624
    churn_rate     = round((churned / total_clients) * 100, 1)
    active_clients = total_clients - churned
    high_risk      = 480
    medium_risk    = 910
    low_risk       = total_clients - high_risk - medium_risk
    arpu_avg       = 185.40

    kpis = {
        "total_clients":  total_clients,
        "churn_rate":     churn_rate,
        "arpu_avg":       arpu_avg,
        "high_risk":      high_risk,
        "medium_risk":    medium_risk,
        "low_risk":       low_risk,
        "active_clients": active_clients,
        "churned_clients": churned,
    }

    churn_by_segment = [
        {"name": "Masivo",      "value": 62},
        {"name": "Pyme",        "value": 28},
        {"name": "Corporativo", "value": 10},
    ]

    churn_by_dept = [
        {"name": "Lima",         "value": 210},
        {"name": "Arequipa",     "value": 85},
        {"name": "La Libertad",  "value": 74},
        {"name": "Piura",        "value": 62},
        {"name": "Cusco",        "value": 51},
        {"name": "Junin",        "value": 43},
        {"name": "Otros",        "value": 99},
    ]

    monthly_trend = [
        {"name": "Ene", "value": 95},
        {"name": "Feb", "value": 102},
        {"name": "Mar", "value": 88},
        {"name": "Abr", "value": 115},
        {"name": "May", "value": 108},
        {"name": "Jun", "value": 97},
        {"name": "Jul", "value": 124},
        {"name": "Ago", "value": 110},
        {"name": "Sep", "value": 99},
        {"name": "Oct", "value": 118},
        {"name": "Nov", "value": 131},
        {"name": "Dic", "value": 104},
    ]

    return {
        "kpis":             kpis,
        "churn_by_segment": churn_by_segment,
        "churn_by_dept":    churn_by_dept,
        "monthly_trend":    monthly_trend,
    }
