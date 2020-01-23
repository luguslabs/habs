# Archipel Chain Test

This directory contains scripts to bootstrap 3 Nodes Archipel chain deployment.

These scripts will use predefined keys from **keys** directory and chain spec from **customSpecRaw.json**.

## Warning! For testing purposes only!

## Requirements

* Docker

## Launch 

Launch bootstrap

```bash
./launch.sh
```

## Remove deployment

```bash
./remove.sh
```

## Using

### WS Endpoint
```bash
ws://127.0.0.1:9944
```

### RPC Endpoint
```bash
127.0.0.1:9933
```

### Graphana Data Source Server
```bash
127.0.0.1:9955
```
