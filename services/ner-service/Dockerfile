FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
# Railway uses repo root as build context, so use full path from repo root
COPY services/ner-service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NER model during build (saves time on first request)
RUN python -c "from transformers import pipeline; pipeline('ner', model='dslim/bert-base-NER')"

# Copy application code
COPY services/ner-service/ .

# Expose port
EXPOSE 8000

# Run the application
# Railway sets PORT automatically, use it if available, otherwise default to 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
