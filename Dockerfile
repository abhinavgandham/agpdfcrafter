# FROM node:24-alpine
FROM --platform=linux/amd64 node:24-alpine
WORKDIR /app

# Install dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# AWS Configuration
ENV AWS_PROFILE=CAB432-STUDENT-901444280953
ENV AWS_REGION=ap-southeast-2

# Secrets Manager Secret Names (with fallbacks)
ENV COGNITO_CLIENT_SECRET=n11795611-cognitoSecret-assessment2
ENV COGNITO_CLIENT_ID_SECRET=n11795611-cognitoClientId-assessment2
ENV USER_POOL_ID_SECRET=n11795611-userPoolId-assessment2
ENV DYNAMODB_TABLE_SECRET=n11795611-dynamoDBTableName-assessment2
ENV S3_BUCKET_SECRET=n11795611-bucketName-assessment2

COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]