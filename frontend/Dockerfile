FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Install a simple static file server
RUN npm install -g serve

# Serve the build folder on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
