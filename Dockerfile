FROM node:16-alpine@sha256:28bed508446db2ee028d08e76fb47b935defa26a84986ca050d2596ea67fd506
RUN apk add dumb-init
USER node
ENV NODE_ENV=production
WORKDIR /app
EXPOSE 3000

COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci --production
COPY dist .
COPY config ./config
CMD ["dumb-init", "node", "main.js"]
