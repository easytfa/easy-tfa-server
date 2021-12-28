FROM node:16-alpine
ENV NODE_ENV=production
WORKDIR /app
EXPOSE 3000

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY dist .
COPY config ./config
CMD ["npm", "run", "start:prod:server"]
