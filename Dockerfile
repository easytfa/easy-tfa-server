FROM node:18-alpine@sha256:7e68e0ab5f106662b4f3a812ebc96548e2fd7880cb8e7d9600de2361ea1eab9a AS build
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
COPY ["tsconfig.json", "tsconfig.build.json", "./"]
COPY src ./src
RUN npm run build
RUN rm dist/tsconfig.build.tsbuildinfo

FROM node:18-alpine@sha256:7e68e0ab5f106662b4f3a812ebc96548e2fd7880cb8e7d9600de2361ea1eab9a
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
