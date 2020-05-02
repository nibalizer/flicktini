FROM alpine:edge

#RUN curl -sL https://rpm.nodesource.com/setup_12.x | bash -
#RUN yum install -y nodejs
RUN apk add nodejs-current opus-dev npm python3 make gcc build-base bash ffmpeg

RUN mkdir /app
WORKDIR /app

COPY package.json /app
#RUN npm install --only=prod
RUN npm install
COPY server /app/server
COPY public /app/public

#ENV TEXT_TO_SPEECH_API_KEY
#ENV DISCORD_GUILD
#ENV DISCORD_TOKEN

ENV NODE_ENV production
ENV PORT 4500

EXPOSE 4500

CMD ["npm", "start"]
