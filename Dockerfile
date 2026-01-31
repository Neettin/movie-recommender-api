# 1. Use an official Python runtime as a base image
FROM python:3.9

# 2. Set the working directory inside the container
WORKDIR /code

# 3. Copy the requirements file from the backend folder
# We do this first to use Docker's cache for faster builds
COPY ./backend/requirements.txt /code/requirements.txt

# 4. Install the Python dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 5. Copy the entire backend folder into the container
# This includes your 'app' folder and 'artifacts'
COPY ./backend /code/app

# 6. Hugging Face Spaces require port 7860
EXPOSE 7860

# 7. Start the FastAPI app
# We point to 'app.main:app' because the backend folder was copied into /code/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]