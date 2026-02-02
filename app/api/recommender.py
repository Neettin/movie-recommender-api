import httpx
import asyncio
import os
import numpy as np
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.loader import model_assets

# Load assets
movies = model_assets['movies']
tfidf_matrix = model_assets['tfidf_matrix']
indices = model_assets['indices']

# Optimization: Pre-lowercase indices for faster searching
indices_lower = {str(k).strip().lower(): v for k, v in indices.items()}

load_dotenv()
API_KEY = os.getenv("TMDB_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def fetch_api_details(client, title):
    """Fallback to get poster, overview, and rating if local data is missing."""
    if not API_KEY: return None
    url = f"https://api.themoviedb.org/3/search/movie?api_key={API_KEY}&query={title}"
    try:
        resp = await client.get(url, timeout=5.0)
        if resp.status_code == 200:
            results = resp.json().get('results')
            return results[0] if results else None
    except: pass
    return None

@app.get("/recommend/{movie_title}")
async def get_recommendations(movie_title: str):
    search_term = movie_title.strip().lower()
    
    if search_term not in indices_lower:
        return {"error": "Movie not found", "recommendations": []}

    # 1. Similarity Logic
    idx = indices_lower[search_term]
    query_vec = tfidf_matrix[idx]
    sim_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

    # 2. Get top 10 (excluding self)
    top_indices = np.argpartition(sim_scores, -11)[-11:]
    top_indices = top_indices[np.argsort(sim_scores[top_indices])][::-1]
    recommended_indices = [i for i in top_indices if i != idx][:10]

    # Combine: [Searched Movie] + [10 Recommendations]
    final_indices = [idx] + recommended_indices

    async with httpx.AsyncClient() as client:
        # Concurrently fetch details for all 11 movies
        tasks = [fetch_api_details(client, movies.iloc[i]['title']) for i in final_indices]
        api_data_list = await asyncio.gather(*tasks)

    results = []
    for count, i in enumerate(final_indices):
        m_local = movies.iloc[i]
        m_api = api_data_list[count] or {}
        
        # Smart Data Selection (API data usually better/fresher)
        results.append({
            "is_searched": (count == 0),
            "title": str(m_local['title']),
            "poster_path": f"https://image.tmdb.org/t/p/w500{m_api.get('poster_path')}" if m_api.get('poster_path') else "https://via.placeholder.com/500x750",
            "overview": m_api.get('overview') or m_local.get('overview') or "Plot details arriving soon...",
            "genres": m_local.get('genres', ''),
            "tagline": m_local.get('tagline', ''),
            "original_language": str(m_local.get('original_language', 'en')).upper(),
            "vote_average": round(float(m_api.get('vote_average') or m_local.get('vote_average', 0)), 1),
            "popularity": round(float(m_api.get('popularity') or m_local.get('popularity', 0)), 1)
        })

    return {"recommendations": results}

@app.get("/")
def health_check():
    return {"status": "online", "database_size": len(movies)}