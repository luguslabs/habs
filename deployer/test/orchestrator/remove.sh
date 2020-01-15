#!/bin/bash
echo "Stopping and removing docker containers..."
docker rm -f orchestrator1 orchestrator2 orchestrator3

docker rm -f node1-polkadot-validator node1-polkadot-sync

docker rm -f node2-polkadot-validator node2-polkadot-sync

docker rm -f node3-polkadot-validator node3-polkadot-sync

docker volume rm -f node1-polkadot-volume node2-polkadot-volume node3-polkadot-volume

echo "Orchestrator removal finished..."
