import pickle
import pandas as pd
import os
from scipy import sparse
import gc

# 1. SETUP PATHS
# Climbs up from app/models/ to the root 'backend' folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Your folder containing .pkl files
ARTIFACTS_PATH = os.path.join(BASE_DIR, "artifacts")

def load_artifacts():
    """
    Loads movie data with aggressive memory optimization.
    - Only loads essential DataFrame columns
    - Converts TF-IDF matrix to sparse format
    - Limits dataset size if too large
    """
    try:
        print(f"--- Loading ML Artifacts from: {ARTIFACTS_PATH} ---")
        
        # Load the Dataframe
        movies_path = os.path.join(ARTIFACTS_PATH, "df.pkl")
        print("Loading movies dataframe...")
        movies = pickle.load(open(movies_path, "rb"))
        
        # Keep ONLY essential columns to reduce memory
        essential_columns = ['title']  # Add 'id', 'overview', etc. if needed
        if isinstance(movies, pd.DataFrame):
            # Only keep columns that exist and are essential
            available_cols = [col for col in essential_columns if col in movies.columns]
            movies = movies[available_cols].copy()
            print(f"Movies dataframe memory: {movies.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
        
        # Load the Title-to-Index Map first (needed for trimming)
        indices_path = os.path.join(ARTIFACTS_PATH, "indices.pkl")
        print("Loading indices...")
        indices = pickle.load(open(indices_path, "rb"))
        
        # Trim dataset if too large (keeps memory under control)
        MAX_MOVIES = 5000
        if len(movies) > MAX_MOVIES:
            print(f"Dataset has {len(movies)} movies. Trimming to {MAX_MOVIES}...")
            movies = movies.head(MAX_MOVIES).copy()
            # Update indices to match trimmed dataset
            indices = {k: v for k, v in indices.items() if v < MAX_MOVIES}
        
        # Load the TF-IDF Matrix
        tfidf_matrix_path = os.path.join(ARTIFACTS_PATH, "tfidf_matrix.pkl")
        print("Loading TF-IDF matrix...")
        tfidf_matrix = pickle.load(open(tfidf_matrix_path, "rb"))
        
        # Trim TF-IDF matrix to match dataset size
        if len(movies) < tfidf_matrix.shape[0]:
            print(f"Trimming TF-IDF matrix from {tfidf_matrix.shape[0]} to {len(movies)} rows...")
            tfidf_matrix = tfidf_matrix[:len(movies)]
        
        # Convert to sparse matrix for HUGE memory savings
        if not sparse.issparse(tfidf_matrix):
            print("Converting TF-IDF to sparse CSR matrix for memory efficiency...")
            tfidf_matrix = sparse.csr_matrix(tfidf_matrix)
            print(f"Conversion complete. Sparse matrix uses much less memory.")
        
        print(f"TF-IDF matrix shape: {tfidf_matrix.shape}")
        print(f"TF-IDF matrix format: {type(tfidf_matrix)}")
        
        # Force garbage collection to free memory
        gc.collect()
        
        print(f"--- All Artifacts Loaded Successfully! ---")
        print(f"Total movies available: {len(movies)}")
        
        return {
            "movies": movies,
            "tfidf_matrix": tfidf_matrix,
            "indices": indices
        }
        
    except FileNotFoundError as e:
        print(f"CRITICAL ERROR: Could not find a .pkl file. {e}")
        raise e
    except Exception as e:
        print(f"AN UNEXPECTED ERROR OCCURRED: {e}")
        import traceback
        traceback.print_exc()
        raise e

# Create the global asset variable used by recommender.py
model_assets = load_artifacts()