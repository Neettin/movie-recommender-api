import httpx
import asyncio
import os
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. IMPORT DATA FROM LOADER
# This must use the 'mmap_mode' version of loader.py to fit in 512MB
from app.models.loader import model_assets

# Assign assets to variables
movies = model_assets['movies']
tfidf_matrix = model_assets['tfidf_matrix']
indices = model_assets['indices']

# Pre-lowercase index keys once at startup to save CPU/Memory during requests
indices_lower = {str(k).strip().lower(): v for k, v in indices.items()}

# Load environment variables
load_dotenv()
API_KEY = os.getenv("TMDB_API_KEY")

# Initialize FastAPI
app = FastAPI(title="Render Optimized Movie Recommender")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_movie_poster_async(client: httpx.AsyncClient, title: str):
    """
    Fetches the poster URL from TMDb API. 
    Returns a placeholder if not found or if the request fails.
    """
    if not API_KEY:
        return "https://via.placeholder.com/500x750?text=No+API+Key"
        
    url = f"https://api.themoviedb.org/3/search/movie?api_key={API_KEY}&query={title}"
    try:
        response = await client.get(url, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            if data.get('results'):
                path = data['results'][0].get('poster_path')
                if path:
                    return f"https://image.tmdb.org/t/p/w500{path}"
    except Exception:
        pass
    return f"https://via.placeholder.com/500x750?text={title.replace(' ', '+')}"

async def recommend_logic(movie_title: str):
    """
    Core recommendation engine optimized for 512MB RAM.
    """
    try:
        search_term = str(movie_title).strip().lower()

        # 1. Find the index
        if search_term not in indices_lower:
            return []
        
        idx = indices_lower[search_term]

        # 2. Compute similarity for ONLY the target movie (Memory Efficient)
        # Using [idx] ensures we get a 2D row vector for cosine_similarity
        movie_vector = tfidf_matrix[idx]
        similarity_scores = cosine_similarity(movie_vector, tfidf_matrix).flatten()

        # 3. Find top 10 using NumPy argpartition (Faster than sorting 45k items)
        # It puts the top 11 values at the end of the array (unsorted)
        top_indices = np.argpartition(similarity_scores, -11)[-11:]
        
        # Now sort just those 11 values to get the correct order
        top_indices = top_indices[np.argsort(similarity_scores[top_indices])][::-1]

        # Remove the movie itself from the recommendations
        recommended_indices = [i for i in top_indices if i != idx][:10]

        # 4. Fetch posters concurrently
        async with httpx.AsyncClient() as client:
            tasks = [get_movie_poster_async(client, movies.iloc[i]['title']) for i in recommended_indices]
            posters = await asyncio.gather(*tasks)

        # 5. Build results
        results = []
        for count, i in enumerate(recommended_indices):
            movie_data = movies.iloc[i]
            results.append({
                "id": int(i),
                "title": str(movie_data['title']),
                "poster_path": posters[count]
            })
        
        return results

    except Exception as e:
        print(f"Error in recommendation logic: {e}")
        return []

# --- API ENDPOINTS ---

@app.get("/")
async def root():
    return {"status": "online", "movies_loaded": len(movies)}

@app.get("/recommend/{movie_title}")
async def get_recommendations(movie_title: str):
    data = await recommend_logic(movie_title)
    if not data:
        return {"movie": movie_title, "error": "Movie not found", "recommendations": []}
    return {"movie": movie_title, "recommendations": data}

@app.get("/health")
async def health():
    return {"status": "healthy"}