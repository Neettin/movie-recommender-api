FROM python:3.9

WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything from current directory
COPY . .

EXPOSE 7860

CMD ["uvicorn", "app.api.recommender:app", "--host", "0.0.0.0", "--port", "7860"]