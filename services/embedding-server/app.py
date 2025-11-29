"""
Local BGE Embedding Server
Compatible with ARM64 (Mac M1/M2/M3) and x86_64
"""

import os
import logging
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

# Configuration
MODEL_NAME = os.getenv('MODEL_NAME', 'BAAI/bge-small-en-v1.5')
PORT = int(os.getenv('PORT', 5000))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Load model on startup
logger.info(f"Loading embedding model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)
logger.info(f"Model loaded successfully! Embedding dimension: {model.get_sentence_embedding_dimension()}")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': MODEL_NAME,
        'dimension': model.get_sentence_embedding_dimension()
    })

@app.route('/embed', methods=['POST'])
def embed():
    """
    Generate embeddings for input text

    Request body:
    {
        "inputs": "text to embed" or ["text1", "text2"]
    }

    Response:
    - For single text: [0.123, -0.456, ...]
    - For multiple texts: [[0.123, ...], [0.456, ...]]
    """
    try:
        data = request.get_json()

        if not data or 'inputs' not in data:
            return jsonify({'error': 'Missing "inputs" field in request body'}), 400

        inputs = data['inputs']

        # Handle both single string and list of strings
        if isinstance(inputs, str):
            embeddings = model.encode(inputs, convert_to_numpy=True)
            # Return as list (single embedding)
            return jsonify(embeddings.tolist())

        elif isinstance(inputs, list):
            embeddings = model.encode(inputs, convert_to_numpy=True)
            # Return as list of lists
            return jsonify(embeddings.tolist())

        else:
            return jsonify({'error': 'inputs must be a string or list of strings'}), 400

    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/info', methods=['GET'])
def info():
    """Get model information"""
    return jsonify({
        'model': MODEL_NAME,
        'dimension': model.get_sentence_embedding_dimension(),
        'max_seq_length': model.max_seq_length,
        'status': 'ready'
    })

if __name__ == '__main__':
    logger.info(f"Starting embedding server on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
