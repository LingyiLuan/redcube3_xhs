FROM nginx:alpine

# Install envsubst (usually already available in alpine)
RUN apk add --no-cache gettext

# Copy nginx.conf template
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# Default PORT if not set (for local development)
ENV PORT=80

EXPOSE 80

# Use envsubst to substitute PORT variable and start nginx
# envsubst without specifying variables will substitute all ${VAR} patterns
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]