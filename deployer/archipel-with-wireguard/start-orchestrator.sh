#!/bin/bash

#detect error in piped command
set -eo pipefail

#functions
function check_cmd {
      if [ "$1" != "0" ]; then
            echo "Error! Can't execute command to $2."
            exit 1
      fi
}

function check_result {
      if [ "$1" == "null" ]; then
            echo "Error! Config for '$2' not found"
            exit 1
      fi
}

#parsing config file
if [ ! -z "$CONFIG_FILE" ]; then
    if [ -z "$NODE_ID" ]; then
        echo "\$NODE_ID must be set"
        exit 1
    fi

    #unpack config file
    if [ ! -f "/config/config.json" ]; then
        #if config file password was set unzip with password
        if [ ! -z "$CONFIG_FILE_PASSWORD" ]; then
                unzip -P "$CONFIG_FILE_PASSWORD" -o /config/archipel-config.zip -d /config
        else 
                unzip -o /config/archipel-config.zip -d /config
        fi
        #check unzip command
        check_cmd $? 'unzip config file'
    fi

    #check if node id is valid
    NODES_NUMBER=$(cat /config/config.json | jq ".nodesNumber")
    if [ "$NODE_ID" -eq "0" ] || [ "$NODE_ID" -gt "$NODES_NUMBER" ]; then
        echo "Invalid node number! Node number must be between 1 and $NODES_NUMBER..."
        exit 1
    fi

    #set variables from config file
    if [ -z "$ARCHIPEL_KEY_SEED" ]; then
        ARCHIPEL_KEY_SEED=$(cat /config/config.json | jq ".archipelNodes[$(( $NODE_ID - 1))].seed" | sed 's/\"//g')
        #check result and if config was extracted successfully
        check_cmd $? 'retrieve ARCHIPEL_KEY_SEED'
        check_result "$ARCHIPEL_KEY_SEED" 'ARCHIPEL_KEY_SEED'
    fi
    if [ -z "$SERVICE" ]; then
        export SERVICE=$(cat /config/config.json | jq ".service.name" | sed 's/\"//g')
        check_cmd $? 'retrieve SERVICE'
        check_result "$SERVICE" 'SERVICE'
    fi

fi

# Setting Archipel orchestrator variables
export NODE_ENV=production
export NODE_WS="ws://127.0.0.1:9944"
export MNEMONIC="$ARCHIPEL_KEY_SEED"
export ALIVE_TIME=60000
export SUSPEND_SERVICE="$ARCHIPEL_SUSPEND_SERVICE"
echo "sleep 5 sec to wait archipel node started and ws endpoint ready..."
sleep 5
echo "Launch orchestrator"
# Launch orchestrator
exec node src/app.js
