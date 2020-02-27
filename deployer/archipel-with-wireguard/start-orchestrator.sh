#!/bin/sh 

#parsing config file
if [ ! -z "$CONFIG_FILE" ]; then
    if [ -z "$NODE_ID" ]; then
        echo "\$NODE_ID must be set"
        exit 1
    fi
    #unpack config file
    if [ ! -f "/config/config.json" ]; then
        unzip -o /config/archipel-config.zip
    fi
    cd /config
    
    #set variables from config file
    ARCHIPEL_KEY_SEED=$(cat config.json | jq ".archipelNodes[$NODE_ID].seed" | sed 's/\"//g')
    SERVICE=$(cat config.json | jq ".service.name" | sed 's/\"//g')

fi

# Setting Archipel orchestrator variables
export NODE_ENV=production
export NODE_WS="ws://127.0.0.1:9944"
export MNEMONIC="$ARCHIPEL_KEY_SEED"
export ALIVE_TIME=60000

# Launch orchestrator
exec node src/app.js
