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

# Set AWS profile for SSO credentials
ENV AWS_PROFILE=CAB432-STUDENT-901444280953
ENV AWS_REGION=ap-southeast-2

# Cognito Configuration
ENV COGNITO_USER_POOL_ID=ap-southeast-2_8XCJUIAAd
ENV COGNITO_CLIENT_ID=h5741pe9oeeg12e37me15045r
ENV COGNITO_CLIENT_SECRET=1qpg7pp1uk6bj3l6sl8qu4dig4c2kagubi103br662rrhhjlu4bm

# S3 Configuration
ENV S3_BUCKET_NAME=pdfconversions-abhinav-n11795611

# DynamoDB Configuration
ENV DYNAMODB_TABLE_NAME=n11795611-abhinavgandham-conversions

COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]