# Multi-stage Dockerfile for Node.js backend

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    curl \
    bash \
    git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=development

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads logs

# Expose port
EXPOSE 4000

# Start development server
CMD ["npm", "run", "dev"]

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    openssl \
    curl \
    dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dronewerx -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R dronewerx:nodejs /app

# Switch to non-root user
USER dronewerx

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["node", "dist/server.js"]