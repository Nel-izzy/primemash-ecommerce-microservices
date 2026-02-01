FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies including devDependencies (nodemon)
RUN npm install

# Copy application code
COPY . .

# Start application in development mode
CMD ["npm", "run", "dev"]