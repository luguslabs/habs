#!/bin/bash
docker rm -f archipel-ui

docker stop archipel{1,2,3,-node}
docker rm archipel{1,2,3,-node}

cd orchestrator && bash remove.sh
cd .. && sudo rm -R archipel{1,2,3,-node}

docker network rm archipel

docker ps