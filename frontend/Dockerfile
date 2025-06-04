# Multi-stage Dockerfile for React frontend

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start development server with Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk upgrade --no-cache

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S dronewerx && \
    adduser -S dronewerx -u 1001 -G dronewerx

# Set proper permissions
RUN chown -R dronewerx:dronewerx /usr/share/nginx/html && \
    chown -R dronewerx:dronewerx /var/cache/nginx && \
    chown -R dronewerx:dronewerx /var/log/nginx && \
    chown -R dronewerx:dronewerx /etc/nginx/conf.d

# Make nginx directories writable
RUN touch /var/run/nginx.pid && \
    chown -R dronewerx:dronewerx /var/run/nginx.pid

# Switch to non-root user
USER dronewerx

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 