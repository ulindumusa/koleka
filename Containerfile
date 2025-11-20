FROM node:24.11.0-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM node:24.11.0-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./
COPY html ./html
COPY js ./js
COPY css ./css

EXPOSE 3000
CMD ["node", "server.js"]
