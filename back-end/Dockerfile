FROM node:16-alpine as builder

ENV NODE_ENV build

USER node
WORKDIR /home/node

COPY package*.json /home/node/
RUN npm i

COPY . /home/node/
RUN npm run build

# ---

FROM node:16-alpine

USER node
WORKDIR /home/node

COPY --from=builder /home/node/package*.json /home/node/
COPY --from=builder /home/node/dist/ /home/node/dist/

RUN npm ci

WORKDIR /home/node/dist

CMD ["node", "main.js"]