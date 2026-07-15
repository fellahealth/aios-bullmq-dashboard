# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock tsconfig.base.json ./
COPY packages/api/package.json packages/api/
COPY packages/ui/package.json packages/ui/
COPY packages/express/package.json packages/express/
COPY packages/nestjs/package.json packages/nestjs/
COPY packages/standalone/package.json packages/standalone/
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn workspace @aios-medical/bullmq-dashboard-api build \
  && yarn workspace @aios-medical/bullmq-dashboard-ui build \
  && yarn workspace @aios-medical/bullmq-dashboard-express build \
  && yarn workspace @aios-medical/bullmq-dashboard-standalone build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock tsconfig.base.json ./
COPY packages/api/package.json packages/api/
COPY packages/ui/package.json packages/ui/
COPY packages/express/package.json packages/express/
COPY packages/nestjs/package.json packages/nestjs/
COPY packages/standalone/package.json packages/standalone/
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=builder /app/packages/api/dist packages/api/dist
COPY --from=builder /app/packages/api/bullMQAdapter.js packages/api/bullMQAdapter.js
COPY --from=builder /app/packages/api/bullAdapter.js packages/api/bullAdapter.js
COPY --from=builder /app/packages/api/typings packages/api/typings
COPY --from=builder /app/packages/express/dist packages/express/dist
COPY --from=builder /app/packages/ui/dist packages/ui/dist
COPY --from=builder /app/packages/standalone/dist packages/standalone/dist

EXPOSE 3000
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "packages/standalone/dist/cli.js"]
