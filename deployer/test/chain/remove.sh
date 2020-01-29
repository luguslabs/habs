#!/bin/bash
echo "Stopping and removing docker containers..."
docker rm -f node{1,2,3}
sleep 5

echo "Removing archipel network..."
docker network rm archipel

echo "Removing nodes volumes..."
docker volume rm node1
docker volume rm node2
docker volume rm node3

echo "Node removal finished..."
