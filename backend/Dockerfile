# Backend Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Build Stage
# ============================================
FROM node:18-slim AS builder

WORKDIR /app

# Install system dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates curl

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for prisma)
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate

# ============================================
# Production Stage
# ============================================
FROM node:18-slim AS production

WORKDIR /app

# Install production system dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh plinko

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma
COPY --from=builder /app/prisma ./prisma

# Copy application code
COPY lib ./lib
COPY routes ./routes
COPY server.js ./

# Set ownership
RUN chown -R plinko:nodejs /app

USER plinko

# Environment
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PROVIDER=postgresql

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:5000/api/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
