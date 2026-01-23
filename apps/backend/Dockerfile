# Single-stage build for production (Simplified for reliability)
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy all essential files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend
COPY .env ./.env

# Install ALL dependencies (needed for prisma and runtime)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5001

# Run the built application
CMD ["node", "dist/main.js"]
