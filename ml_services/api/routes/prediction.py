from fastapi import APIRouter, HTTPException
from api.schemas.prediction import MonthlyPredictionRequest, MonthlyPredictionResponse
from api.services.inference import predict_monthly_average

router = APIRouter(tags=["Prediction"])

@router.post("/predict/monthly", response_model=MonthlyPredictionResponse)
def predict_monthly(batch: MonthlyPredictionRequest):
    try:
        result = predict_monthly_average(batch.weeks)
        return MonthlyPredictionResponse(**result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
