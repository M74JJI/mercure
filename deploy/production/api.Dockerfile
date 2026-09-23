FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6

ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@12.4.2 --activate

COPY --chown=node:node dist/apps/api/ ./

RUN pnpm install --prod --frozen-lockfile --no-optional \
    && pnpm store prune \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.cache/node/corepack /pnpm \
    && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "main.js"]
