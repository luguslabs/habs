#!/bin/sh 

#check env variables
export NODE_ENV=production

# Setting Archipel Variables
export NODE_WS="ws://127.0.0.1:9944"
export MNEMONIC="TOBEDEFINE"

# Polkadot Validator Variables
export POLKADOT_NAME=
export POLKADOT_KEY=
export POLKADOT_IMAGE=
export POLKADOT_CONTAINER_PREFIX=


exec node src/app.js