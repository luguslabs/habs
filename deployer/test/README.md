# Archipel Stack Test

This directory contains scripts to bootstrap a federation of 3 Archipel Nodes.

## Contains

* 3 Archipel Chain Nodes
* 3 Archipel Orchestrators

## Warning! For testing purposes only!

## Requirements

* Docker

## Launch 

```bash
./launch.sh
```

## Remove deployment

```bash
./remove.sh
```

## Stop Archipel Node
```bash
./stop-node.sh $NODENUMBER
```
* NODENUMBER must be 1,2 or 3.
* Warning! Before using this script you must launch Archipel Federation with launch script.

## Restart Archipel Node
```bash
./restart-node.sh $NODENUMBER
```
* NODENUMBER must be 1,2 or 3.
* Warning! Before using this script you must launch Archipel Federation with launch script.

## Archipel Chain Node WS Endpoint
```bash
ws://127.0.0.1:9944
```
