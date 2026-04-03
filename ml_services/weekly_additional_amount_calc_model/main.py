from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from .schemas import WeeklyPriceRequest, WeeklyPriceResponse, RiskScores
from .llm_service import load_gemini, analyze_risk, test_gemini_connection
from .pricing_engine import calculate_weekly_pricing

# Load environment variables early
load_dotenv()
load_gemini()

router = APIRouter(tags=["Weekly Additional Price Model"])

@router.post("/calculate-weekly-price", response_model=WeeklyPriceResponse)
def calculate_weekly_price_api(request: WeeklyPriceRequest):
    try:
        # Call Gemini for risk scores
        risk_data = analyze_risk(
            weather=request.weather.dict(),
            news_summary=request.news_summary,
            outages=request.outages.dict()
        )
        
        # Calculate final price details in pricing engine
        weekly_addition, final_price, increase_pct = calculate_weekly_pricing(
            base_price=request.base_price,
            risk_scores=risk_data
        )
        
        reason = risk_data.get("reason", "No reason provided by model.")
        
        return WeeklyPriceResponse(
            city_id=request.city_id,
            city=request.city,
            base_price=request.base_price,
            weekly_addition=weekly_addition,
            final_price=final_price,
            increase_pct=increase_pct,
            risk_scores=RiskScores(
                weather_risk=risk_data.get("weather_risk"),
                news_risk=risk_data.get("news_risk"),
                outage_risk=risk_data.get("outage_risk")
            ),
            reason=reason
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/health")
def health_check():
    gemini_status = test_gemini_connection()
    status = "healthy" if gemini_status else "degraded"
    
    return JSONResponse(
        status_code=200 if gemini_status else 503,
        content={
            "status": status,
            "gemini_api_connection": "connected" if gemini_status else "failed"
        }
    )

# Standalone execution hook for testing
if __name__ == "__main__":
    import uvicorn
    from fastapi import FastAPI
    app = FastAPI(title="Standalone Weekly Pricing App")
    app.include_router(router)
    uvicorn.run(app, host="0.0.0.0", port=8001)
