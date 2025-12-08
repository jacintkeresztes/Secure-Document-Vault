FROM nginx:alpine

COPY views/*.html /usr/share/nginx/html

COPY public /usr/share/nginx/html/public

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy integrity verification files
COPY integrity.sha256 /usr/share/nginx/html/integrity.sha256
COPY verify-integrity.sh /usr/local/bin/verify-integrity.sh
RUN chmod +x /usr/local/bin/verify-integrity.sh

# Create entrypoint script that verifies integrity before starting nginx
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo '/usr/local/bin/verify-integrity.sh || exit 1' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]