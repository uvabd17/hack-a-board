# Dockerfile for Socket.IO server on Fly.io
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY index.ts ./

# Install dev dependencies for build
RUN npm install --only=development

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
