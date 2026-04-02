import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.core.config import load_resources
from api.routes.prediction import router as prediction_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models and dataset history globally on startup
    load_resources()
    yield

app = FastAPI(title="City Base Price Calc Model API", lifespan=lifespan)

app.include_router(prediction_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
