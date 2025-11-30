FROM nginx:alpine

# Install envsubst (usually already available in alpine)
RUN apk add --no-cache gettext

# Copy nginx.conf template
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# Default ports if not set (for local development)
ENV PORT=80
ENV USER_SERVICE_PORT=3001
ENV INTERVIEW_SERVICE_PORT=3002
ENV CONTENT_SERVICE_PORT=3003
ENV NOTIFICATION_SERVICE_PORT=3004

EXPOSE 80

# Use envsubst to substitute only specific environment variables
# Only PORT and service port variables will be substituted
# Nginx variables like $host, $scheme remain unchanged
CMD ["/bin/sh", "-c", "envsubst '$$PORT $$USER_SERVICE_PORT $$INTERVIEW_SERVICE_PORT $$CONTENT_SERVICE_PORT $$NOTIFICATION_SERVICE_PORT' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]