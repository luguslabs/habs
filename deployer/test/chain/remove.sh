#!/bin/bash
echo "Stopping and removing docker containers..."
docker rm -f node{1,2,3}

echo "Removing archipel network..."
docker network rm archipel

echo "Removing nodes dirs..."
sudo rm -rf node{1,2,3}

echo "Node removal finished..."
