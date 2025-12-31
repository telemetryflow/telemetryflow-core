# Build stage
FROM node:25-alpine AS builder

WORKDIR /app

# Install system dependencies including bash and make for Makefile support
RUN apk add --no-cache git make python3 g++ bash

# Install pnpm
RUN npm install -g pnpm

# Copy package files and Makefile
COPY package.json pnpm-lock.yaml Makefile ./

# Install dependencies using Makefile
RUN make ci-install

# Copy source code
COPY . .

# Build the application
RUN make ci-build

# Production stage
FROM node:25-alpine

WORKDIR /app

# Install system dependencies including bash for proper shell support
RUN apk add --no-cache dumb-init wget bash

# Install pnpm
RUN npm install -g pnpm

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]
