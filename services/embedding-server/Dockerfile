FROM python:3.11-slim

WORKDIR /app

# Install dependencies
# Railway build context will be the service directory (services/embedding-server)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
