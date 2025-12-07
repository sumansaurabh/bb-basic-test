FROM node:18-alpine

WORKDIR /app

# Set Node.js memory limits and options for production
ENV NODE_OPTIONS="--max-old-space-size=460 --max-semi-space-size=32"
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod=false

COPY . .

# Build with memory constraints
RUN NODE_OPTIONS="--max-old-space-size=920" pnpm build

# Remove dev dependencies to save memory
RUN pnpm prune --prod

EXPOSE 3000

# Copy server wrapper for graceful shutdown
COPY server.js ./

# Use server wrapper for proper signal handling
CMD ["node", "server.js"]
