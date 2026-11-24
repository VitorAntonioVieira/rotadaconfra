FROM oven/bun:1-alpine AS base
WORKDIR /app

# Instala dependencias em camada separada para aproveitar cache
FROM base AS deps
COPY package.json ./
RUN bun install --production

# Imagem final enxuta
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/api/health || exit 1

CMD ["bun", "run", "src/index.ts"]
