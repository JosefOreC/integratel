import pandas as pd
from xgboost import XGBClassifier
import joblib

model = joblib.load('app/ml/model.joblib')

c1 = pd.DataFrame([{
    'antiguedad_meses': 12, 'num_reclamos': 0, 'mttr_prom': 0, 'sat_media': 0, 'total_averias': 0,
    'arpu': 100, 'pct_venc': 0, 'deuda_promedio': 0, 'max_dias_atraso': 0, 'seg_enc': 2, 'dep_enc': 7
}])
c2 = pd.DataFrame([{
    'antiguedad_meses': 12, 'num_reclamos': 0, 'mttr_prom': 0, 'sat_media': 5, 'total_averias': 0,
    'arpu': 100, 'pct_venc': 0, 'deuda_promedio': 0, 'max_dias_atraso': 0, 'seg_enc': 2, 'dep_enc': 7
}])

p1 = model.predict_proba(c1)[0][1]
p2 = model.predict_proba(c2)[0][1]
print(f'Colab prob (sat=0): {p1:.4f}')
print(f'Web prob (sat=5): {p2:.4f}')

