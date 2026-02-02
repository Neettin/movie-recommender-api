# backend/app/schemas/movie.py
from pydantic import BaseModel
from typing import List, Optional

# This is what a single movie looks like
class Movie(BaseModel):
    title: str
    id: int
    poster_path: Optional[str] = None

# This is what the API sends back (a list of movies)
class RecommendationResponse(BaseModel):
    movie_title: str
    recommendations: List[Movie]