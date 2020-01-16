#!/bin/bash

cd chain && bash remove.sh
cd ../orchestrator && bash remove.sh

docker ps
