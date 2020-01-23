#!/bin/bash
docker rm -f archipel-ui

docker stop archipel{1,2,3}
docker rm archipel{1,2,3}

cd test/orchestrator && bash remove.sh
cd ../.. && sudo rm -R archipel1 archipel2 archipel3

docker ps
