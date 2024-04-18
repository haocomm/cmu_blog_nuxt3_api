FROM node:12.20.1-alpine3.10

ENV TZ=Asia/Bangkok

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /app
COPY . /app/

WORKDIR /app
RUN npm install

EXPOSE 5000

CMD [ "npm", "start" ]