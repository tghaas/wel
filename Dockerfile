FROM node:18-alpine

WORKDIR /app

COPY package.json .

COPY yarn.lock .

RUN yarn install --ignore-optional

COPY /build/ .

EXPOSE 8080

CMD ["yarn", "start"]
