# Use official Node.js LTS
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies first (leverage docker cache)
# Use wildcard to copy package.json and optionally package-lock.json if present
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Run the server
CMD ["npm", "start"]
