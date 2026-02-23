# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built app
COPY --from=builder /app/dist ./dist

# Expose port and run
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/main"]
