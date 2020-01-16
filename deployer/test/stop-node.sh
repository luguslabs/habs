#!/bin/bash

echo "Stopping chain node $1, orchestrator $1 and polkadot node $1..."
docker stop orchestrator$1 node$1 node$1-polkadot-validator node$1-polkadot-sync 

docker ps
