import pickle
import pandas as pd
import os
from sklearn.metrics.pairwise import cosine_similarity

# 1. SETUP PATHS
# Climbs up from app/models/ to the root 'backend' folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Your folder containing .pkl files
ARTIFACTS_PATH = os.path.join(BASE_DIR, "artifacts")

def load_artifacts():
    """
    Loads movie data and generates a Cosine Similarity matrix on the fly
    to ensure recommendation logic has real scores to sort.
    """
    try:
        print(f"--- Loading ML Artifacts from: {ARTIFACTS_PATH} ---")
        
        # Load the Dataframe
        movies_path = os.path.join(ARTIFACTS_PATH, "df.pkl")
        movies = pickle.load(open(movies_path, "rb"))
        
        # Load the TF-IDF Matrix (The features)
        tfidf_matrix_path = os.path.join(ARTIFACTS_PATH, "tfidf_matrix.pkl")
        tfidf_matrix = pickle.load(open(tfidf_matrix_path, "rb"))
        
        # IMPORTANT: Generate Similarity Matrix from TF-IDF Matrix
        # This converts (5000, 10000) features into a (5000, 5000) score matrix
        print("--- Calculating Cosine Similarity Matrix... ---")
        similarity = cosine_similarity(tfidf_matrix)
        
        # Load the Title-to-Index Map
        indices_path = os.path.join(ARTIFACTS_PATH, "indices.pkl")
        indices = pickle.load(open(indices_path, "rb"))
        
        print(f"--- All Artifacts Loaded Successfully! Matrix Shape: {similarity.shape} ---")
        
        return {
            "movies": movies,
            "similarity": similarity,
            "indices": indices
        }
        
    except FileNotFoundError as e:
        print(f"CRITICAL ERROR: Could not find a .pkl file. {e}")
        raise e
    except Exception as e:
        print(f"AN UNEXPECTED ERROR OCCURRED: {e}")
        raise e

# Create the global asset variable used by recommender.py
model_assets = load_artifacts()