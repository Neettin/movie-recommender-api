from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import the function with a clear name
from app.api.recommender import recommend as get_recommendations
from app.schemas.movie import RecommendationResponse

app = FastAPI()

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Movie Recommendation API is live!"}


@app.get("/recommend", response_model=RecommendationResponse)
async def recommend_route(movie_title: str):
    # Use await because the function is now async
    results = await get_recommendations(movie_title) 
    return {
        "movie_title": movie_title,
        "recommendations": results
    }