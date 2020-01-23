#!/bin/bash

docker start orchestrator$1
docker start node$1 

docker ps 
