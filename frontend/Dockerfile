FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files and configs
COPY . .

EXPOSE 3000

# Start the Vite development server
CMD ["npm", "start"]