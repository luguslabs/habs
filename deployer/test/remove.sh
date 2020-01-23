#!/bin/bash

cd chain && bash remove.sh
cd ../orchestrator && bash remove.sh

docker rm -f archipel-ui

docker ps
