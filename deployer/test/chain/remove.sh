#!/bin/bash
echo "Stopping and removing docker containers..."
docker rm -f node1 node2 node3

echo "Removing archipel network..."
docker network rm archipel

echo "Removing nodes dirs..."
sudo rm -rf node1/ node2/ node3/

echo "Node removal finished..."