import joblib
import pandas as pd
import os
from scipy import sparse
import gc

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTIFACTS_PATH = os.path.join(BASE_DIR, "artifacts")

def load_artifacts():
    print(f"--- RENDER-OPTIMIZED LOAD: {45447} movies with Full Metadata ---")
    try:
        # 1. Load DataFrame as a Read-Only Memory Map
        movies_path = os.path.join(ARTIFACTS_PATH, "df.pkl")
        movies = joblib.load(movies_path, mmap_mode='r')
        
        # IMPORTANT: Do NOT use .copy() or filter columns here.
        # Selecting columns like movies[['title']] creates a new object in RAM.
        # We leave the full 'movies' object as a memory-mapped reference.

        # 2. Load the Index Map (Small enough for RAM)
        indices_path = os.path.join(ARTIFACTS_PATH, "indices.pkl")
        indices = joblib.load(indices_path)

        # 3. Load TF-IDF Matrix as Memory Map
        tfidf_path = os.path.join(ARTIFACTS_PATH, "tfidf_matrix.pkl")
        tfidf_matrix = joblib.load(tfidf_path, mmap_mode='r')

        # Ensure it is a CSR matrix for fast math
        if not sparse.issparse(tfidf_matrix):
            tfidf_matrix = sparse.csr_matrix(tfidf_matrix)

        gc.collect()
        return {
            "movies": movies,
            "tfidf_matrix": tfidf_matrix,
            "indices": indices
        }
    except Exception as e:
        print(f"Load Error: {e}")
        raise e

model_assets = load_artifacts()