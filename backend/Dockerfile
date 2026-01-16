# Backend Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Build Stage
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for prisma)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# ============================================
# Production Stage
# ============================================
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S plinko -u 1001

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
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
