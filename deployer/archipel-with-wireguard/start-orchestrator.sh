#!/bin/sh 

#parsing config file
if [ ! -z "$CONFIG_FILE" ]; then
    if [ -z "$NODE_ID" ]; then
        echo "\$NODE_ID must be set"
        exit 1
    fi

    #unpack config file
    if [ ! -f "/config/config.json" ]; then
        unzip -o /config/archipel-config.zip -d /config
    fi

    #set variables from config file
    ARCHIPEL_KEY_SEED=$(cat /config/config.json | jq ".archipelNodes[$(( $NODE_ID - 1))].seed" | sed 's/\"//g')
    export SERVICE=$(cat /config/config.json | jq ".service.name" | sed 's/\"//g')

fi

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
