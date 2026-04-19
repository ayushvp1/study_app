# Use Bun official image
FROM oven/bun:latest

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies for the whole workspace
RUN bun install

# Build all packages (including shared and server)
# We use the root build script which triggers turbo
RUN bun run build

# Expose the server port
ENV PORT=3000
ENV JWT_SECRET="conquerors-lobby-secret-777"
ENV NODE_ENV=production

EXPOSE 3000

# Start the server from the server package
WORKDIR /app/server
CMD ["bun", "src/index.ts"]
