# Use Apify's base Node.js image
FROM apify/actor-node:18

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --include=dev --audit=false

# Copy source code
COPY . ./

# Run the actor
CMD npm start
