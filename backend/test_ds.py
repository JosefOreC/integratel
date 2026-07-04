import pandas as pd
from app.services import service_data
service_data.load_dw('Integratel_dw.xlsx')
df = service_data.get_df_model()
print('Total clientes:', len(df))
print('Tasa de churn:', round(df['churn'].mean() * 100, 2), '%')

