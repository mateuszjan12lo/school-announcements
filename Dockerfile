# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Development image: hot reload, dev seed enabled ──
FROM deps AS dev
ENV NODE_ENV=development APP_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

# ── Production image: runs safety check, no dev seed ──
FROM deps AS build
# Zmienne NEXT_PUBLIC_* są wbudowywane w kod podczas buildu – podaj je jako --build-arg (adres i klucz anon PRODUKCYJNEGO Supabase).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV APP_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN node scripts/check-prod-safety.mjs && npm run build

FROM base AS prod
ENV NODE_ENV=production APP_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
