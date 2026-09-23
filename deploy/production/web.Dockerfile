FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /app

COPY --chown=node:node dist/apps/web-standalone/ ./

RUN set -eu; \
    server="$(find /app -type f -name server.js ! -path '*/node_modules/*' -print)"; \
    count="$(printf '%s\n' "$server" | sed '/^$/d' | wc -l)"; \
    test "$count" -eq 1; \
    server_dir="$(dirname "$server")"; \
    server_file="$(basename "$server")"; \
    printf '#!/bin/sh\nset -eu\ncd "%s"\nexec node "%s"\n' "$server_dir" "$server_file" > /usr/local/bin/start-mercure-web; \
    chmod 0555 /usr/local/bin/start-mercure-web; \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.cache/node/corepack

USER node

EXPOSE 3000

CMD ["/usr/local/bin/start-mercure-web"]
