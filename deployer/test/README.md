# Archipel Federation Test

This directory contains scripts to bootstrap a federation of 3 Archipel Nodes.

## Contains

* 3 Archipel Nodes (Archipel Chain Validator Node + Archipel Orchestrator)
* 1 Archipel Chain Non Validator Node
* 1 Archipel UI (Available at: http://localhost:8080)

## Warning! For testing purposes only!

## Requirements

* Docker

## Launch federation

```bash
./orchestrator/launch.sh
```

## Remove federation

```bash
./orchestrator/remove.sh
```

## Archipel Chain Node Endpoints
```bash
Websocket: 127.0.0.1:9944
RPC: 127.0.0.1:9933
P2P: 127.0.0.1:30333
```
