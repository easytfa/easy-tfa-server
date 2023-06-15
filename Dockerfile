FROM node:18.16.0-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
COPY ["tsconfig.json", "tsconfig.build.json", "./"]
COPY src ./src
RUN npm run build
RUN rm dist/tsconfig.build.tsbuildinfo

FROM node:18.16.0-bookworm-slim
COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
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
