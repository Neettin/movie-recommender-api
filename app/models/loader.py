import pickle
import pandas as pd
import os
from sklearn.metrics.pairwise import cosine_similarity

# 1. SETUP PATHS
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTIFACTS_PATH = os.path.join(BASE_DIR, "artifacts")

def load_artifacts():
    """
    Loads movie data WITHOUT precomputing full similarity matrix.
    We'll compute similarities on-demand for each request instead.
    """
    try:
        print(f"--- Loading ML Artifacts from: {ARTIFACTS_PATH} ---")
        
        # Load the Dataframe
        movies_path = os.path.join(ARTIFACTS_PATH, "df.pkl")
        movies = pickle.load(open(movies_path, "rb"))
        
        # Load the TF-IDF Matrix (keep this for on-demand similarity)
        tfidf_matrix_path = os.path.join(ARTIFACTS_PATH, "tfidf_matrix.pkl")
        tfidf_matrix = pickle.load(open(tfidf_matrix_path, "rb"))
        
        # Load the Title-to-Index Map
        indices_path = os.path.join(ARTIFACTS_PATH, "indices.pkl")
        indices = pickle.load(open(indices_path, "rb"))
        
        print(f"--- All Artifacts Loaded Successfully! TF-IDF Shape: {tfidf_matrix.shape} ---")
        
        return {
            "movies": movies,
            "tfidf_matrix": tfidf_matrix,  # Store this instead of similarity
            "indices": indices
        }
        
    except FileNotFoundError as e:
        print(f"CRITICAL ERROR: Could not find a .pkl file. {e}")
        raise e
    except Exception as e:
        print(f"AN UNEXPECTED ERROR OCCURRED: {e}")
        raise e

# Create the global asset variable
model_assets = load_artifacts()