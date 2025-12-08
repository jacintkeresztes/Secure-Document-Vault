FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy integrity verification files
COPY integrity.sha256 /app/integrity.sha256
COPY verify-integrity.sh /usr/local/bin/verify-integrity.sh
RUN chmod +x /usr/local/bin/verify-integrity.sh

# Create entrypoint script that verifies integrity before starting app
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo '/usr/local/bin/verify-integrity.sh || exit 1' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "dev"]