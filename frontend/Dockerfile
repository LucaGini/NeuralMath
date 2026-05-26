FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json* ./

# Install packages
RUN npm install

# Copy source
COPY . .

# Expose Vite standard development port
EXPOSE 5173

# Run Vite in host-aware development mode
CMD ["npm", "run", "dev", "--", "--host"]
