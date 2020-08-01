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
    if [ -f "/config/archipel-config.zip" ]; then
        echo "start-orchestrator.sh : unzip /config/archipel-config.zip"
        #if config file password was set unzip with password
        if [ ! -z "$CONFIG_FILE_PASSWORD" ]; then
            echo "start-orchestrator.sh : unzip if first time  with -u option."
            unzip -u -P "$CONFIG_FILE_PASSWORD" -o /config/archipel-config.zip -d /config
            echo "start-orchestrator.sh : refresh all configs files with unzip -f option."
            unzip -f -P "$CONFIG_FILE_PASSWORD" -o /config/archipel-config.zip -d /config
        else 
            echo "start-orchestrator.sh : unzip if first time  with -u option."
            unzip -u -o /config/archipel-config.zip -d /config
            echo "start-orchestrator.sh : refresh all configs files with unzip -f option."
            unzip -f -o /config/archipel-config.zip -d /config
        fi
    else
        echo "start-orchestrator.sh : no file /config/archipel-config.zip"
    fi

    #check if node id is valid
    NODES_NUMBER=$(cat /config/config.json | jq ".nodesNumber")
    if [ "$NODE_ID" -eq "0" ] || [ "$NODE_ID" -gt "$NODES_NUMBER" ]; then
        echo "Invalid node number! Node number must be between 1 and $NODES_NUMBER..."
        exit 1
    fi

    #set variables from config file
    #get NODES_ROLE
    if [ -z "$NODES_ROLE" ]; then
        NODES_ROLE=$(cat /config/config.json | jq ".nodesRole")
        check_cmd $? 'retrieve NODES_ROLE'
        if [ "$NODES_ROLE" == "null" ]; then
            echo "Assure old config support. Force config NODES_ROLE to 'operator,operator,operator'"
            NODES_ROLE="operator,operator,operator"
        fi
        IFS=',' read -ra rolesArray <<< "$NODES_ROLE"
        index=$(( $NODE_ID - 1 ))
        NODE_ROLE=${rolesArray[index]}
    fi

    #get nexmoApiKey
    if [ -z "$NEXMO_API_KEY" ]; then
        NEXMO_API_KEY_LIST=$(cat /config/config.json | jq ".nexmoApiKey")
        check_cmd $? 'retrieve NEXMO_API_KEY_LIST'
        if [ "$NEXMO_API_KEY_LIST" != "null" ]; then
            IFS=',' read -ra apikeysArray <<< "$NEXMO_API_KEY_LIST"
            index=$(( $NODE_ID - 1 ))
            value=${apikeysArray[index]}
            if [ "$value" != "null" ]; then
                NEXMO_API_KEY=${apikeysArray[index]}
            fi
        fi
    fi

    #get nexmoApiSecret
    if [ -z "$NEXMO_API_SECRET" ]; then
        NEXMO_API_SECRET_LIST=$(cat /config/config.json | jq ".nexmoApiSecret")
        check_cmd $? 'retrieve NEXMO_API_SECRET_LIST'
        if [ "$NEXMO_API_SECRET_LIST" != "null" ]; then
            IFS=',' read -ra apiSecretArray <<< "$NEXMO_API_SECRET_LIST"
            index=$(( $NODE_ID - 1 ))
            value=${apiSecretArray[index]}
            if [ "$value" != "null" ]; then
                NEXMO_API_SECRET=${apiSecretArray[index]}
            fi
        fi
    fi

    #get nexmoSignatureMethod
    if [ -z "$NEXMO_API_SIGNATURE_METHOD" ]; then
        NEXMO_API_SIGNATURE_METHOD_LIST=$(cat /config/config.json | jq ".nexmoApiSignatureMethod")
        check_cmd $? 'retrieve NEXMO_API_SIGNATURE_METHOD_LIST'
        if [ "$NEXMO_API_SIGNATURE_METHOD_LIST" != "null" ]; then
            IFS=',' read -ra signatureMethodsArray <<< "$NEXMO_API_SIGNATURE_METHOD_LIST"
            index=$(( $NODE_ID - 1 ))
            value=${signatureMethodsArray[index]}
            if [ "$value" != "null" ]; then
                NEXMO_API_SIGNATURE_METHOD=${signatureMethodsArray[index]}
            fi
        fi
    fi

    #get nexmoSignatureSecret
    if [ -z "$NEXMO_API_SIGNATURE_SECRET" ]; then
        NEXMO_API_SIGNATURE_SECRET_LIST=$(cat /config/config.json | jq ".nexmoApiSignatureSecret")
        check_cmd $? 'retrieve NEXMO_API_SIGNATURE_SECRET_LIST'
        if [ "$NEXMO_API_SIGNATURE_SECRET_LIST" != "null" ]; then
            IFS=',' read -ra signatureSecretsArray <<< "$NEXMO_API_SIGNATURE_SECRET_LIST"
            index=$(( $NODE_ID - 1 ))
            value=${signatureSecretsArray[index]}
            if [ "$value" != "null" ]; then
                NEXMO_API_SIGNATURE_SECRET=${signatureSecretsArray[index]}
            fi
        fi
    fi

    #get NexmoPhoneNumber
    if [ -z "$NEXMO_PHONE_NUMBER" ]; then
        NEXMO_PHONE_NUMBER_LIST=$(cat /config/config.json | jq ".nexmoPhoneNumber")
        check_cmd $? 'retrieve NEXMO_PHONE_NUMBER_LIST'
        if [ "$NEXMO_PHONE_NUMBER_LIST" != "null" ]; then
            IFS=',' read -ra phoneNumbersArray <<< "$NEXMO_PHONE_NUMBER_LIST"
            index=$(( $NODE_ID - 1 ))
            value=${phoneNumbersArray[index]}
            if [ "$value" != "null" ]; then
                NEXMO_PHONE_NUMBER=${phoneNumbersArray[index]}
            fi
        fi
    fi

    if [ -z "$OUTLET_PHONE_NUMBER_LIST" ]; then
        OUTLET_PHONE_NUMBER_LIST=$(cat /config/config.json | jq ".outletPhoneNumber")
        check_cmd $? 'retrieve OUTLET_PHONE_NUMBERS'
        if [ "$OUTLET_PHONE_NUMBERS" != "null" ]; then
            OUTLET_PHONE_NUMBER_LIST=$OUTLET_PHONE_NUMBER_LIST
        fi
    fi

    #get ARCHIPEL_KEY_SEED
    if [ -z "$ARCHIPEL_KEY_SEED" ]; then
        ARCHIPEL_KEY_SEED=$(cat /config/config.json | jq ".archipelNodes[$(( $NODE_ID - 1))].seed" | sed 's/\"//g')
        #check result and if config was extracted successfully
        check_cmd $? 'retrieve ARCHIPEL_KEY_SEED'
        check_result "$ARCHIPEL_KEY_SEED" 'ARCHIPEL_KEY_SEED'
    fi
    #get SERVICE
    if [ -z "$SERVICE" ]; then
        export SERVICE=$(cat /config/config.json | jq ".service.name" | sed 's/\"//g')
        check_cmd $? 'retrieve SERVICE'
        check_result "$SERVICE" 'SERVICE'
    fi
    #get ARCHIPEL_AUTHORITIES_SR25519_LIST
    if [ -z "$ARCHIPEL_AUTHORITIES_SR25519_LIST" ]; then
        ARCHIPEL_AUTHORITIES_SR25519_LIST=$(cat /config/config.json | jq ".archipelSr25519List" | sed 's/\"//g')
        check_cmd $? 'retrieve ARCHIPEL_AUTHORITIES_SR25519_LIST'
        check_result $ARCHIPEL_AUTHORITIES_SR25519_LIST 'ARCHIPEL_AUTHORITIES_SR25519_LIST'
    fi
    #get ARCHIPEL_NAME
    if [ -z "$ARCHIPEL_NAME" ]; then
        ARCHIPEL_NAME=$(cat /config/config.json | jq ".name" | sed 's/\"//g')
        check_cmd $? 'retrieve ARCHIPEL_NAME'
        check_result $ARCHIPEL_NAME 'ARCHIPEL_NAME'
    fi

fi

if [ -z "$NODES_ROLE" ]; then
  echo "Assure old config support. Force config NODES_ROLE to 'operator,operator,operator'"
  NODES_ROLE="operator,operator,operator"
fi
echo "NODES_ROLE=$NODES_ROLE"

if [ -z "$NODE_ROLE" ]; then
  echo "Assure old config support. Force config NODE_ROLE to 'operator'"
  NODE_ROLE="operator"
fi
echo "NODE_ROLE=$NODE_ROLE"

if [ -z "$SMS_STONITH_ACTIVE" ]; then
  echo "set default value to false for SMS_STONITH_ACTIVE"
  SMS_STONITH_ACTIVE="false"
fi

if [ -z "$SMS_STONITH_CALLBACK_MANDATORY" ]; then
  echo "set default value to false for SMS_STONITH_CALLBACK_MANDATORY"
  SMS_STONITH_CALLBACK_MANDATORY="false"
fi

if [ -z "$NEXMO_API_CHECK_MSG_SIGNATURE" ]; then
  NEXMO_API_CHECK_MSG_SIGNATURE="false"
fi

if [ -z "$NEXMO_API_KEY" ]; then
  NEXMO_API_KEY="null"
fi

if [ -z "$NEXMO_API_SECRET" ]; then
  NEXMO_API_SECRET="null"
fi

if [ -z "$NEXMO_API_SIGNATURE_METHOD" ]; then
  NEXMO_API_SIGNATURE_METHOD="null"
fi

if [ -z "$NEXMO_API_SIGNATURE_SECRET" ]; then
  NEXMO_API_SIGNATURE_SECRET="null"
fi

if [ -z "$NEXMO_PHONE_NUMBER" ]; then
  NEXMO_PHONE_NUMBER="null"
fi

if [ -z "$OUTLET_PHONE_NUMBER_LIST" ]; then
  OUTLET_PHONE_NUMBER_LIST="null"
fi

if [ -z "$OUTLET_PHONE_NUMBER_LIST" ]; then
  OUTLET_PHONE_NUMBER_LIST="null"
fi

if [ -z "$ARCHIPEL_SERVICE_MODE" ]; then
  # ARCHIPEL_SERVICE_MODE = active|passive|sentry|orchestrator
  ARCHIPEL_SERVICE_MODE="orchestrator"
fi

if [ -z "$ARCHIPEL_METRICS_ENABLE" ]; then
  ARCHIPEL_METRICS_ENABLE="true"
fi

if [ -z "$ARCHIPEL_ORCHESTRATION_ENABLE" ]; then
  ARCHIPEL_ORCHESTRATION_ENABLE="true"
fi

# Setting Archipel orchestrator variables
NODE_ROLE=$(echo $NODE_ROLE | sed 's/\"//g')
NODES_ROLE=$(echo $NODES_ROLE | sed 's/\"//g')
export NODE_ENV=production
export NODE_WS="ws://127.0.0.1:9944"
export NODE_ROLE=$NODE_ROLE
export NODES_ROLE=$NODES_ROLE
export MNEMONIC="$ARCHIPEL_KEY_SEED"
export NODES_WALLETS="$ARCHIPEL_AUTHORITIES_SR25519_LIST"
export ARCHIPEL_NAME="$ARCHIPEL_NAME"
export ALIVE_TIME=12
export ARCHIPEL_SERVICE_MODE="$ARCHIPEL_SERVICE_MODE"
export ARCHIPEL_METRICS_ENABLE="$ARCHIPEL_METRICS_ENABLE"
export ARCHIPEL_ORCHESTRATION_ENABLE="$ARCHIPEL_ORCHESTRATION_ENABLE"
export AUTHORITIES_LIST="$ARCHIPEL_AUTHORITIES_SR25519_LIST"
export SMS_STONITH_ACTIVE="$SMS_STONITH_ACTIVE"
export SMS_STONITH_CALLBACK_MANDATORY="$SMS_STONITH_CALLBACK_MANDATORY"
export NEXMO_API_KEY="$NEXMO_API_KEY"
export NEXMO_API_SECRET="$NEXMO_API_SECRET"
export NEXMO_API_SIGNATURE_METHOD="$NEXMO_API_SIGNATURE_METHOD"
export NEXMO_API_SIGNATURE_SECRET="$NEXMO_API_SIGNATURE_SECRET"
export NEXMO_API_CHECK_MSG_SIGNATURE="$NEXMO_API_CHECK_MSG_SIGNATURE"
export NEXMO_PHONE_NUMBER="$NEXMO_PHONE_NUMBER"
export OUTLET_PHONE_NUMBER_LIST="$OUTLET_PHONE_NUMBER_LIST"



# Generate env file in shared volume for Archipel UI to auto-detect the local API endpoint
ARCHIPEL_CONTAINER_IP=$(awk 'END{print $1}' /etc/hosts)
echo "Generate env file /config/archipel-ui.env in shared volume for Archipel UI to auto-detect the local API endpoint"
echo 'export REACT_APP_API_URL=http://'$ARCHIPEL_CONTAINER_IP':3000'
mkdir -p /config
echo 'export REACT_APP_API_URL=http://'$ARCHIPEL_CONTAINER_IP':3000' > /config/archipel-ui.env

# Launching orchestrator
echo "Waiting 5 seconds for Archipel Node to start..."
sleep 5
echo "Launching orchestrator..."
exec node src/app.js
