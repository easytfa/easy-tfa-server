FROM node:16-alpine@sha256:28bed508446db2ee028d08e76fb47b935defa26a84986ca050d2596ea67fd506 AS build
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
COPY ["tsconfig.json", "tsconfig.build.json", "./"]
COPY src ./src
RUN npm run build
RUN rm dist/tsconfig.build.tsbuildinfo

FROM node:16-alpine@sha256:28bed508446db2ee028d08e76fb47b935defa26a84986ca050d2596ea67fd506
RUN apk add dumb-init
USER node
ENV NODE_ENV=production
WORKDIR /app
EXPOSE 80

COPY --chown=node:node ["package.json", "package-lock.json", "./"]
RUN npm ci --production
COPY --chown=node:node config ./config
COPY --chown=node:node --from=build dist .
CMD ["dumb-init", "node", "main.js"]
