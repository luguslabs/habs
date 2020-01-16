#!/bin/bash
echo "Launching chain..."
cd chain && bash launch.sh
echo "Launching orchestrators..."
cd ../orchestrator && bash launch.sh

docker ps

