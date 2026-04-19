# Use Bun official image
FROM oven/bun:latest

WORKDIR /app

# Copy all files
COPY . .

# Build frontend
WORKDIR /app/client
RUN bun install
RUN bun run build

# Setup backend
WORKDIR /app/server
RUN bun install

# Environment variables
ENV PORT=3000
ENV JWT_SECRET="conquerors-lobby-secret-777"
ENV NODE_ENV=production

EXPOSE 3000

# Start the server
CMD ["bun", "src/index.ts"]
