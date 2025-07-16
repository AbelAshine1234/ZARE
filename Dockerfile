# Use Node 18 base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies early (better layer caching)
COPY package*.json ./
RUN npm install

# Copy rest of the application
COPY . .

# Ensure Prisma schema and client are included
# These lines are unnecessary unless .dockerignore excludes them
# COPY prisma ./prisma
# COPY generated ./generated

# Generate Prisma client
RUN npx prisma generate

# Expose app port
EXPOSE 4000

# Start with nodemon for hot reload (use legacy polling from nodemon.json)
CMD ["npx", "nodemon", "src/index.js"]
