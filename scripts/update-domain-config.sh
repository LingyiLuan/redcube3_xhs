#!/bin/bash

# Script to update domain configuration after setting up Cloudflare
# Usage: ./scripts/update-domain-config.sh yourdomain.com

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Domain name required"
  echo "Usage: ./scripts/update-domain-config.sh yourdomain.com"
  exit 1
fi

DOMAIN=$1
API_DOMAIN="api.${DOMAIN}"

echo "🌐 Updating configuration for domain: ${DOMAIN}"
echo "📡 API domain: ${API_DOMAIN}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    echo "❌ .env.example not found. Please create .env manually."
    exit 1
  fi
fi

# Update .env file
echo "📝 Updating .env file..."

# Function to update or add env variable
update_env() {
  local key=$1
  local value=$2
  
  if grep -q "^${key}=" .env; then
    # Update existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s|^${key}=.*|${key}=${value}|" .env
    else
      # Linux
      sed -i "s|^${key}=.*|${key}=${value}|" .env
    fi
  else
    # Add new
    echo "${key}=${value}" >> .env
  fi
}

# Update environment variables
update_env "FRONTEND_URL" "https://${DOMAIN}"
update_env "VITE_API_GATEWAY_URL" "https://${API_DOMAIN}"
update_env "GOOGLE_CALLBACK_URL" "https://${API_DOMAIN}/api/auth/google/callback"
update_env "LINKEDIN_CALLBACK_URL" "https://${API_DOMAIN}/api/auth/linkedin/callback"
update_env "ALLOWED_ORIGINS" "https://${DOMAIN},https://www.${DOMAIN}"
update_env "NODE_ENV" "production"
update_env "SESSION_COOKIE_SECURE" "true"

echo "✅ .env file updated!"
echo ""
echo "📋 Next steps:"
echo "1. Update OAuth providers with new callback URLs:"
echo "   - Google: https://console.cloud.google.com/apis/credentials"
echo "   - LinkedIn: https://www.linkedin.com/developers/apps"
echo ""
echo "2. Restart services:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "3. Test your domain:"
echo "   - Frontend: https://${DOMAIN}"
echo "   - API: https://${API_DOMAIN}/health"
echo ""


