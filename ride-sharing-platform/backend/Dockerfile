# Backend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

# Install dependencies
RUN npm ci --workspace=@rideshare/shared --workspace=backend

# Build the shared package
FROM base AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN npm run build

# Build the backend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY backend ./backend
WORKDIR /app/backend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built files
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=expressjs:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=expressjs:nodejs /app/backend/package.json ./backend/
COPY --from=deps --chown=expressjs:nodejs /app/node_modules ./node_modules

USER expressjs

EXPOSE 3001

ENV PORT=3001

WORKDIR /app/backend

CMD ["node", "dist/index.js"]
