#!/bin/bash


while true; 
do
    curl -s localhost:4500/data.json | jq '.'
    sleep 0.05
    clear
done
