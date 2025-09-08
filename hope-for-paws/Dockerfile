# Multi-stage build for Hope for Paws application
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app/frontend

# Copy package files
COPY package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY . .

# Build frontend
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend-builder

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY ../backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY ../backend/ ./

# Production stage
FROM node:18-alpine

# Install PM2 for process management
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Copy backend from builder stage
COPY --from=backend-builder /app/backend ./backend

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Create PM2 ecosystem file
COPY ecosystem.config.js ./

# Create uploads directory
RUN mkdir -p ./backend/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"] 