#!/bin/bash
echo "Stopping and removing docker containers..."
docker stop orchestrator{1,2,3}
docker rm orchestrator{1,2,3}

docker rm -f node{1,2,3}-polkadot-validator node{1,2,3}-polkadot-sync

docker volume rm -f node{1,2,3}-polkadot-volume

echo "Orchestrator removal finished..."
