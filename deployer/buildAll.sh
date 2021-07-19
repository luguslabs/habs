#!/bin/bash
tag="test"

echo "Building chain container..."
cd ../chain
docker build -t luguslabs/archipel-chain:$tag .
cd -

echo "Building cli container..."
cd ../cli
docker build -t luguslabs/archipel-cli:$tag .
cd -

echo "Building orchestrator container..."
cd ../orchestrator
docker build -t luguslabs/archipel-orchestrator:$tag .
cd -

echo "Building UI container..."
cd ../ui
docker build -t luguslabs/archipel-ui:$tag .
cd -

echo "Building archipel container..."
cd ..
docker build -t luguslabs/archipel:$tag . -f deployer/archipel/Dockerfile
cd -
