import pandas as pd
from xgboost import XGBClassifier
import joblib

model = joblib.load('app/ml/model.joblib')

cliente = pd.DataFrame([{
    'antiguedad_meses': 24,
    'num_reclamos': 2,
    'mttr_prom': 120,
    'sat_media': 7,
    'total_averias': 1,
    'arpu': 180,
    'pct_venc': 15,
    'deuda_promedio': 10,
    'max_dias_atraso': 5,
    'seg_enc': 2,
    'dep_enc': 7
}])
prob = model.predict_proba(cliente)[0][1]
print(f'Colab prob: {prob:.4f}')

