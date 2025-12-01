FROM python:3.11-slim

WORKDIR /app

# Install dependencies
# Railway uses repo root as build context, so use full path from repo root
COPY services/embedding-server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/embedding-server/app.py .

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
