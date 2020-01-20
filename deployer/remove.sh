#!/bin/bash
cd test/orchestrator && bash remove.sh

docker rm -f archipel-ui

docker rm -f archipel1 archipel2 archipel3

docker ps
