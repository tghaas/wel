FROM node:20-alpine

WORKDIR /app

COPY package.json .

COPY yarn.lock .

RUN corepack enable

RUN yarn install

COPY /build/ .

EXPOSE 8080

CMD ["yarn", "start"]
