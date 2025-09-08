FROM nginx:1.25-alpine

# Copy static site
COPY src/index.html /usr/share/nginx/html/index.html

EXPOSE 80

# Basic healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1


