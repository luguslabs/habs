#!/bin/bash
echo "Stopping and removing docker containers..."
docker stop orchestrator{1,2,3,4}
docker rm orchestrator{1,2,3,4}

docker rm -f node{1,2,3,4}-polkadot-validator node{1,2,3,4}-polkadot-sync node{1,2,3,4}-polkadot-sentry

docker volume rm -f node{1,2,3,4}-polkadot-volume orchestrator{1,2,3,4}_service

echo "Orchestrator removal finished..."
