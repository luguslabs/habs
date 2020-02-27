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

    #check if node id is valid
    NODES_NUMBER=$(cat /config/config.json | jq ".nodesNumber")
    if [ "$NODE_ID" -eq "0" ] || [ "$NODE_ID" -gt "$NODES_NUMBER" ]; then
        echo "Invalid node number! Node number must be between 1 and $NODES_NUMBER..."
        exit 1
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

# Launch orchestrator
exec node src/app.js
