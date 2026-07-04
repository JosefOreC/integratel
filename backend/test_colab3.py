import pandas as pd
from app.ml.predictor import load_model, run_prediction
load_model()
res=run_prediction(101, 1, 135, 7, 2, 98, 25, 1, 4, 'Residencial', 'Cajamarca')
print(res)

