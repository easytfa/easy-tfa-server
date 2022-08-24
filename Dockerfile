FROM node:18-alpine@sha256:0738685cff8a6bbace6a8f308986729e9b31b07083de252d3b2a321473f99089 AS build
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
COPY ["tsconfig.json", "tsconfig.build.json", "./"]
COPY src ./src
RUN npm run build
RUN rm dist/tsconfig.build.tsbuildinfo

FROM node:18-alpine@sha256:0738685cff8a6bbace6a8f308986729e9b31b07083de252d3b2a321473f99089
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
