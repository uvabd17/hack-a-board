# Dockerfile for Socket.IO server on Fly.io
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY index.ts ./

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
