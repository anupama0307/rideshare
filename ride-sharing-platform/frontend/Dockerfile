# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm ci --workspace=@rideshare/shared --workspace=frontend

# Build the shared package
FROM base AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN npm run build

# Build the frontend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY frontend ./frontend

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_MAPBOX_TOKEN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

WORKDIR /app/frontend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static files
COPY --from=builder /app/frontend/public ./frontend/public

# Set permissions for prerender cache
RUN mkdir -p ./frontend/.next
RUN chown nextjs:nodejs ./frontend/.next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "frontend/server.js"]
