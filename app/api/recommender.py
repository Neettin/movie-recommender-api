import httpx
import asyncio
import os
import pandas as pd
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app instance
app = FastAPI(title="Movie Recommender API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. IMPORT YOUR DATA FROM LOADER
from app.models.loader import model_assets

# 2. ASSIGN THEM TO LOCAL VARIABLES
movies = model_assets['movies']
tfidf_matrix = model_assets['tfidf_matrix']
indices = model_assets['indices']

# Create a lowercase index map for flexible searching
indices_lower = {str(k).strip().lower(): v for k, v in indices.items()}

load_dotenv()
API_KEY = os.getenv("TMDB_API_KEY")

async def get_movie_poster_async(client, title):
    """
    Searches TMDb by title to get the most accurate poster_path.
    """
    url = f"https://api.themoviedb.org/3/search/movie?api_key={API_KEY}&query={title}"
    try:
        response = await client.get(url, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            if data.get('results') and len(data['results']) > 0:
                path = data['results'][0].get('poster_path')
                if path:
                    return f"https://image.tmdb.org/t/p/w500{path}"
    except Exception as e:
        print(f"TMDb Search Error for {title}: {e}")
    
    return "https://via.placeholder.com/500x750?text=No+Poster"

async def recommend(movie_title: str):
    try:
        # Normalize the input
        search_term = str(movie_title).strip().lower()
        print(f"--- Processing request for: {movie_title} (Requesting 10 results) ---")

        # 1. Check if movie exists in our index
        if search_term not in indices_lower:
            print(f"DEBUG: '{search_term}' not found in dataset.")
            return []

        # 2. Get the index of the movie
        idx = indices_lower[search_term]
        
        # 3. Calculate similarity ON-DEMAND for this movie only
        movie_vector = tfidf_matrix[idx]
        similarity_scores = cosine_similarity(movie_vector, tfidf_matrix)[0]
        
        # 4. Get top 10 similar movies (excluding the movie itself)
        movie_list = sorted(list(enumerate(similarity_scores)), reverse=True, key=lambda x: x[1])[1:11]
        
        print(f"DEBUG: Found {len(movie_list)} similar movies. Fetching posters...")

        # 5. Fetch posters asynchronously using titles
        async with httpx.AsyncClient() as client:
            tasks = []
            for i in movie_list:
                m_title = movies.iloc[i[0]]['title']
                tasks.append(get_movie_poster_async(client, m_title))
            
            posters = await asyncio.gather(*tasks)
            
            # 6. Format the final results
            results = []
            for count, i in enumerate(movie_list):
                movie_data = movies.iloc[i[0]]
                results.append({
                    "id": count,
                    "title": str(movie_data['title']),
                    "poster_path": posters[count]
                })
            
            print(f"DEBUG: Successfully prepared {len(results)} movies for '{movie_title}'")
            return results

    except Exception as e:
        print(f"CRITICAL ERROR in recommend function: {e}")
        return []

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Movie Recommender API is running!"}

@app.get("/recommend/{movie_title}")
async def get_recommendations(movie_title: str):
    """
    Get movie recommendations based on a movie title
    """
    recommendations = await recommend(movie_title)
    return {"movie": movie_title, "recommendations": recommendations}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "total_movies": len(movies)}