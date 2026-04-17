# Stage 1: Build the TypeScript code
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including devDependencies needed for tsc)
COPY package*.json ./
RUN npm ci

# Copy the source code and build
COPY . .
RUN npx tsc

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /app

# Install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy only the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/app.js"]
