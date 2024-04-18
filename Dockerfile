FROM node:20-alpine

ENV TZ=Asia/Bangkok

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /app
COPY . /app/

WORKDIR /app
RUN npm install

EXPOSE 5000

CMD [ "npm", "start" ]