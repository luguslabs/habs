#!/bin/bash

echo "Stopping archipel $1..."
docker stop archipel$1

docker ps
