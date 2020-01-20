#!/bin/sh 

#check env variables
export NODE_ENV=production

# NODE_WS, MNEMONIC, ALIVE_TIME
# Setting Archipel Variables
export NODE_WS="ws://127.0.0.1:9944"
export MNEMONIC=$ARCHIPEL_KEY_SEED

# Polkadot Validator Variables
export POLKADOT_NAME=$ARCHIPEL_NODE_ALIAS

exec node src/app.js
