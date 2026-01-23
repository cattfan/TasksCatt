# Multi-stage build for production
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy all essential files for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
# Copy workspace packages and the specific app
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies (including workspace deps)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Deploy production deps to a temporary folder
# This creates a folder with package.json and fully resolved node_modules
RUN pnpm --filter=backend --prod deploy /prod/backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy the deployed production dependencies
COPY --from=builder /prod/backend/node_modules ./node_modules
COPY --from=builder /prod/backend/package.json ./package.json

# Copy built application code
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/.env ./.env

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5001

CMD ["node", "dist/main.js"]
