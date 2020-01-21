#!/bin/sh 
# Setting Archipel orchestrator variables
export NODE_ENV=production
export NODE_WS="ws://127.0.0.1:9944"
export MNEMONIC="$ARCHIPEL_KEY_SEED"

# Launch orchestrator
node src/app.js
