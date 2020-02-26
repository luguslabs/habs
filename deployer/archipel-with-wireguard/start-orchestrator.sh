#!/bin/sh 
# Setting Archipel orchestrator variables
export NODE_ENV=production
export NODE_WS="ws://127.0.0.1:9944"
export MNEMONIC="$ARCHIPEL_KEY_SEED"
export ALIVE_TIME=60000
echo "sleep 5 sec to wait archipel node started and ws endpoint ready..."
sleep 5
echo "Launch orchestrator"
# Launch orchestrator
exec node src/app.js
