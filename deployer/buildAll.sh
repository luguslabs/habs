#!/bin/bash

echo "build chain"
tag="test"


cd ../chain
docker build -t luguslabs/archipel-chain:$tag .
cd -

echo "build cli"
cd ../cli
docker build -t luguslabs/archipel-cli:$tag .
cd -

echo "build orchestrator"
cd ../orchestrator
docker build -t luguslabs/archipel-orchestrator:$tag .
cd -

echo "build ui"
cd ../ui
docker build -t luguslabs/archipel-ui:$tag .
cd -

echo "build archipel"
cd ..
docker build -t luguslabs/archipel:$tag . -f deployer/archipel/Dockerfile
cd -



