#!/bin/bash

. env.sh

docker pull quay.io/nibalizer/flicktini

docker kill flicktini
docker rm flicktini


docker run -d \
    -e TEXT_TO_SPEECH_API_KEY -e DISCORD_GUILD -e DISCORD_TOKEN \
    -p 4500:4500/tcp \
    --name flicktini\
    --restart=always \
    quay.io/nibalizer/flicktini

for i in 1 2 3 4 5
do
        sleep 1
        echo .
done

docker logs flicktini
