#!/bin/bash
echo "Launching chain..."
cd chain && bash launch.sh
echo "Launching orchestrators..."
cd ../orchestrator && bash launch.sh

echo "Launching and Opening Archipel UI..."
docker run -d -p 8080:80 --name archipel-ui luguslabs/archipel-ui
echo "Archipel UI is running at http://localhost:8080 ..."

docker ps
