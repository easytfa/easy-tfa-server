FROM node:18-alpine@sha256:b3ca07adf425d043e180464aac97cb4f7a566651f77f4ecb87b10c10788644bb AS build
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
COPY ["tsconfig.json", "tsconfig.build.json", "./"]
COPY src ./src
RUN npm run build
RUN rm dist/tsconfig.build.tsbuildinfo

FROM node:18-alpine@sha256:b3ca07adf425d043e180464aac97cb4f7a566651f77f4ecb87b10c10788644bb
RUN apk add dumb-init
USER node
ENV NODE_ENV=production
WORKDIR /app
RUN mkdir data
VOLUME /app/data
EXPOSE 80

COPY --chown=node:node ["package.json", "package-lock.json", "./"]
RUN npm ci --omit=dev
COPY --chown=node:node config ./config
COPY --chown=node:node --from=build dist .
CMD ["dumb-init", "node", "main.js"]
