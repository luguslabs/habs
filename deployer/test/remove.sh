#!/bin/bash
docker rm -f archipel-ui

docker stop archipel{1,2,3,-node}
docker rm archipel{1,2,3,-node}

cd orchestrator && bash remove.sh
sleep 5

echo "Removing archipel volumes..."
docker volume rm archipel{1,2,3,-node}
docker volume rm archipel{1,2,3}_service

docker network rm archipel

docker ps