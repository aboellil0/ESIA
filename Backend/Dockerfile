FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    --no-audit \
    --no-fund \
    --prefer-offline \
    && npm cache clean --force \
    && rm -rf /tmp/* /root/.npm

COPY --from=builder /app/dist ./dist

# Pre-create uploads directories (adapted for ESIA - keep same structure for compatibility)
RUN mkdir -p /app/uploads/products/images /app/uploads/products/videos \
    /app/uploads/projects/images /app/uploads/projects/videos \
    /app/uploads/team/images /app/uploads/articles/images \
    /app/uploads/clients/images /app/uploads/history/images \
    /app/uploads/clientFeedback/images /app/uploads/misc/images \
    /app/uploads/misc/docs

RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000
CMD ["node", "dist/server.js"]
