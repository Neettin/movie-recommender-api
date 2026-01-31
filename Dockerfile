# 1. Use lightweight Python image
FROM python:3.10-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy requirements.txt from ROOT
COPY requirements.txt .

# 4. Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy backend code (includes app + artifacts)
COPY backend ./backend

# 6. Hugging Face uses port 7860
EXPOSE 7860

# 7. Start FastAPI app
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
