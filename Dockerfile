FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 59049
CMD ["node", "lolbot-kakao.js"]
