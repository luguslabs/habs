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
            echo "Error! Config for '$2' not found in config file."
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
        echo "start-chain.sh : unzip /config/archipel-config.zip"
        #if config file password was set unzip with password
        if [ ! -z "$CONFIG_FILE_PASSWORD" ]; then
            echo "start-chain.sh : unzip if first time  with -u option."
            unzip -u -P "$CONFIG_FILE_PASSWORD" -o /config/archipel-config.zip -d /config
            echo "start-chain.sh : refresh all configs files with unzip -f option."
            unzip -f -P "$CONFIG_FILE_PASSWORD" -o /config/archipel-config.zip -d /config
        else
            echo "start-chain.sh : unzip if first time  with -u option."
            unzip -u -o /config/archipel-config.zip -d /config
            echo "start-chain.sh : refresh all configs files with unzip -f option."
            unzip -f -o /config/archipel-config.zip -d /config
        fi
    else
        echo "start-chain.sh : no file /config/archipel-config.zip"
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
      fi

      #set variables from config file if they are not set
      if [ -z "$ARCHIPEL_NODE_ALIAS" ]; then
            ARCHIPEL_NODE_ALIAS_CMD=$(cat /config/config.json | jq '.name' | sed 's/\"//g')
            #check result and if config was extracted successfully
            check_cmd $? 'retrieve ARCHIPEL_NODE_ALIAS_CMD'
            check_result $ARCHIPEL_NODE_ALIAS_CMD 'ARCHIPEL_NODE_ALIAS'
            ARCHIPEL_NODE_ALIAS="$ARCHIPEL_NODE_ALIAS_CMD-$NODE_ID"
      fi
      if [ -z "$ARCHIPEL_KEY_SEED" ]; then
            ARCHIPEL_KEY_SEED=$(cat /config/config.json | jq ".archipelNodes[$(( $NODE_ID - 1 ))].seed" | sed 's/\"//g')
            check_cmd $? 'retrieve ARCHIPEL_KEY_SEED'
            check_result $ARCHIPEL_KEY_SEED 'ARCHIPEL_KEY_SEED'
      fi
      if [ -z "$ARCHIPEL_NODE_KEY_FILE" ]; then
            ARCHIPEL_NODE_KEY_FILE=$(cat /config/config.json | jq ".archipelNodes[$(( $NODE_ID - 1 ))].nodeIds.idFile" | sed 's/\"//g')
            check_cmd $? 'retrieve ARCHIPEL_NODE_KEY_FILE'
            check_result $ARCHIPEL_NODE_KEY_FILE 'ARCHIPEL_NODE_KEY_FILE'
      fi
      if [ -z "$ARCHIPEL_AUTHORITIES_SR25519_LIST" ]; then
            ARCHIPEL_AUTHORITIES_SR25519_LIST=$(cat /config/config.json | jq ".archipelSr25519List" | sed 's/\"//g')
            check_cmd $? 'retrieve ARCHIPEL_AUTHORITIES_SR25519_LIST'
            check_result $ARCHIPEL_AUTHORITIES_SR25519_LIST 'ARCHIPEL_AUTHORITIES_SR25519_LIST'
      fi
      if [ -z "$ARCHIPEL_AUTHORITIES_ED25519_LIST" ]; then
            ARCHIPEL_AUTHORITIES_ED25519_LIST=$(cat /config/config.json | jq ".archipelEd25519List" | sed 's/\"//g')
            check_cmd $? 'retrieve ARCHIPEL_AUTHORITIES_ED25519_LIST'
            check_result $ARCHIPEL_AUTHORITIES_ED25519_LIST 'ARCHIPEL_AUTHORITIES_ED25519_LIST'
      fi
      if [ -z "$ARCHIPEL_RESERVED_PEERS" ]; then
            ARCHIPEL_RESERVED_PEERS=$(cat /config/config.json | jq ".archipelReservedPeersList" | sed 's/\"//g')
            check_cmd $? 'retrieve ARCHIPEL_RESERVED_PEERS'
            check_result $ARCHIPEL_RESERVED_PEERS 'ARCHIPEL_RESERVED_PEERS'
      fi
fi

#check if env vars are set
if [ -z "$ARCHIPEL_NODE_ALIAS" ]
then
      echo "\$ARCHIPEL_NODE_ALIAS is empty"
      exit 1
fi

if [ -z "$ARCHIPEL_LISTEN_PORT" ]
then
      echo "\$ARCHIPEL_LISTEN_PORT not set. Set default to 30334"
      ARCHIPEL_LISTEN_PORT=30334
fi

if [ -z "$ARCHIPEL_KEY_SEED" ]
then
      echo "\$ARCHIPEL_KEY_SEED is empty"
      exit 1
fi

if [ -z "$ARCHIPEL_NODE_KEY_FILE" ]
then
      echo "\$ARCHIPEL_NODE_KEY_FILE is empty. set default filename archipel_node_key_file that must be uploaded"
      ARCHIPEL_NODE_KEY_FILE="archipel_node_key_file"
fi

if [ ! -f /config/$ARCHIPEL_NODE_KEY_FILE ]
then
      echo "\$/config/$ARCHIPEL_NODE_KEY_FILE file not found"
      exit 1
fi

if [ -z "$ARCHIPEL_AUTHORITIES_SR25519_LIST" ]
then
      echo "\$ARCHIPEL_AUTHORITIES_SR25519_LIST is empty"
      exit 1
fi

echo "ARCHIPEL_AUTHORITIES_SR25519_LIST is: $ARCHIPEL_AUTHORITIES_SR25519_LIST"
#sanitize ARCHIPEL_AUTHORITIES_SR25519_LIST
#remove potential bad char
ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN=$(echo $ARCHIPEL_AUTHORITIES_SR25519_LIST | tr -d ' ' | tr -d '"' | tr -d '[' | tr -d ']' | tr "," "\n")

if [ -z "$ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN" ]
then
      echo "\$ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN is empty"
      exit 1
fi

echo "ARCHIPEL_AUTHORITIES_ED25519_LIST is: $ARCHIPEL_AUTHORITIES_ED25519_LIST"
#sanitize ARCHIPEL_AUTHORITIES_LIST
#remove potential bad  char
ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN=$(echo $ARCHIPEL_AUTHORITIES_ED25519_LIST | tr -d ' ' | tr -d '"' | tr -d '[' | tr -d ']' | tr "," "\n")

if [ -z "$ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN" ]
then
      echo "\$ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN is empty"
      exit 1
fi

if [ ! -f /usr/local/bin/subkey ]
then
      echo "Missing 'subkey' utility. It is necessary to extract keys."
      exit 1
fi

ARCHIPEL_SS58_ADDRESS_ED25519=$(subkey inspect --network substrate --scheme Ed25519 "$ARCHIPEL_KEY_SEED" | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_SS58_ADDRESS_ED25519" ]
then
      echo "\$ARCHIPEL_SS58_ADDRESS_ED25519 no found using subkey"
      exit 1
fi

ARCHIPEL_SS58_ADDRESS_SR25519=$(subkey inspect --network substrate --scheme Sr25519 "$ARCHIPEL_KEY_SEED" | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_SS58_ADDRESS_SR25519" ]
then
      echo "\$ARCHIPEL_SS58_ADDRESS_SR25519 no found using subkey"
      exit 1
fi

ARCHIPEL_PUBLIC_KEY_ED25519=$(subkey inspect --network substrate --scheme Ed25519 "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_PUBLIC_KEY_ED25519" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY_ED25519 no found using subkey"
      exit 1
fi

ARCHIPEL_PUBLIC_KEY_SR25519=$(subkey inspect --network substrate --scheme Sr25519 "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')
if [ -z "$ARCHIPEL_PUBLIC_KEY_SR25519" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY_SR25519 no found using subkey"
      exit 1
fi

echo "decoded from seed : ARCHIPEL_SS58_ADDRESS_ED25519 : $ARCHIPEL_SS58_ADDRESS_ED25519"
echo "decoded from seed : ARCHIPEL_PUBLIC_KEY_ED25519 : $ARCHIPEL_PUBLIC_KEY_ED25519"
echo "decoded from seed : ARCHIPEL_SS58_ADDRESS_SR25519 : $ARCHIPEL_SS58_ADDRESS_SR25519"
echo "decoded from seed : ARCHIPEL_PUBLIC_KEY_SR25519 : $ARCHIPEL_PUBLIC_KEY_SR25519"
echo "ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN : $ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN"
echo "ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN : $ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN"

# Valorized config spec chain template with envs varabales
if [ ! -f "/root/chain/archipelTemplateSpec.json" ]
then
      echo "missing chain spec template /root/chain/archipelTemplateSpec.json"
      exit 1
fi

if [ -z "$NODES_ROLE" ]; then
  echo "Assure old config support. Force config NODES_ROLE to 'operator,operator,operator'"
  NODES_ROLE="operator,operator,operator"
fi
echo "NODES_ROLE=$NODES_ROLE"
NODES_ROLE=$(echo $NODES_ROLE | sed 's/\"//g')
IFS=',' read -ra rolesArray <<< "$NODES_ROLE"

# clear bootnodes array in template 
cp  -f /root/chain/archipelTemplateSpec.json /root/chain/archipelSpec.json
cat /root/chain/archipelSpec.json | jq '.bootNodes = []'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# replace  "name": "Template"
cat /root/chain/archipelSpec.json | jq  '.name = "Archipel"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# replace  "id": "template"
cat /root/chain/archipelSpec.json | jq  '.id = "archipel"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to palletAura.authorities
 cat /root/chain/archipelSpec.json | jq '.genesis.runtime.palletAura.authorities = []'  > /tmp/archipelSpecTmp.json
 mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
indexArray=0
for AUTH in $ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN
do
      NODE_ROLE=${rolesArray[indexArray]}
      NODE_ROLE=$(echo $NODE_ROLE | sed 's/\"//g')
      if [ "$NODE_ROLE" == "sentry" ] || [ "$NODE_ROLE" == "operator" ]
      then
            cat /root/chain/archipelSpec.json | jq --arg AUTH $AUTH '.genesis.runtime.palletAura.authorities += [$AUTH]'  > /tmp/archipelSpecTmp.json
            mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
      else
            echo "skip add in ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN because NODE_ROLE=$NODE_ROLE "
      fi
      indexArray=$(( $indexArray + 1 ))
done

# add SS58 Adress to palletGrandpa.authorities
cat /root/chain/archipelSpec.json | jq '.genesis.runtime.palletGrandpa.authorities = ["REPLACE_AUTHORITIES_HERE"]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
LIST_TO_INJECT=""
indexArray=0
for ITEM in $ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN
do
      NODE_ROLE=${rolesArray[indexArray]}
      NODE_ROLE=$(echo $NODE_ROLE | sed 's/\"//g')
      if [ "$NODE_ROLE" == "sentry" ] || [ "$NODE_ROLE" == "operator" ]
      then
            ITEM_OUTPUT=$(echo "[\"$ITEM\",1]")
            LIST_TO_INJECT="$LIST_TO_INJECT $ITEM_OUTPUT,"
      else
            echo "skip add in ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN because NODE_ROLE=$NODE_ROLE "
      fi
      indexArray=$(( $indexArray + 1 ))
done

# remove last , of loop
LIST_TO_INJECT=${LIST_TO_INJECT%?} 
sed -i "s/\"REPLACE_AUTHORITIES_HERE\"/`echo $LIST_TO_INJECT`/g" /root/chain/archipelSpec.json

# add SS58 Adress Balances 
cat /root/chain/archipelSpec.json | jq '.genesis.runtime.palletBalances.balances = ["REPLACE_BALANCES_HERE"]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
LIST_TO_INJECT=""
indexArray=0
for ITEM in $ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN
do
      NODE_ROLE=${rolesArray[indexArray]}
      NODE_ROLE=$(echo $NODE_ROLE | sed 's/\"//g')
      if [ "$NODE_ROLE" == "sentry" ] || [ "$NODE_ROLE" == "operator" ]
      then
            ITEM_OUTPUT=$(echo "[\"$ITEM\",1152921504606847000]")
            LIST_TO_INJECT="$LIST_TO_INJECT $ITEM_OUTPUT,"
      else
            echo "skip add in ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN because NODE_ROLE=$NODE_ROLE "
      fi
      indexArray=$(( $indexArray + 1 ))
done

# remove last , of loop
LIST_TO_INJECT=${LIST_TO_INJECT%?} 
sed -i "s/\"REPLACE_BALANCES_HERE\"/`echo $LIST_TO_INJECT`/g" /root/chain/archipelSpec.json


# reserved peers list construct
RESERVED_PEERS_PARAM="--reserved-only"
if [ ! -z "$ARCHIPEL_RESERVED_PEERS" ]
then
      indexArray=0
      for ITEM in $(echo $ARCHIPEL_RESERVED_PEERS |  tr "," " ")
      do
            NODE_ROLE=${rolesArray[indexArray]}
            NODE_ROLE=$(echo $NODE_ROLE | sed 's/\"//g')
            if [ "$NODE_ROLE" == "sentry" ] || [ "$NODE_ROLE" == "operator" ]
            then
                  echo "NODE_ROLE = $NODE_ROLE. Include  PeerId in reserved peers list"
                  RESERVED_PEERS_PARAM="$RESERVED_PEERS_PARAM --reserved-nodes $ITEM"
            else
                  echo "NODE_ROLE = sentryExternal. Do NOT include PeerId in reserved peers list"
            fi
            indexArray=$(( $indexArray + 1 ))
      done
fi

ARCHIPEL_TELEMETRY_URL_CMD="--no-telemetry"
if [ ! -z "$ARCHIPEL_TELEMETRY_URL" ] && [ ! "--no-telemetry" == "$ARCHIPEL_TELEMETRY_URL" ]
then
      ARCHIPEL_TELEMETRY_URL_CMD="$ARCHIPEL_TELEMETRY_URL"
fi
echo "ARCHIPEL_TELEMETRY_URL_CMD: $ARCHIPEL_TELEMETRY_URL_CMD"

ARCHIPEL_TELEMETRY_LOGLEVEL_CMD="0"
if [ ! -z "$ARCHIPEL_TELEMETRY_LOGLEVEL" ]
then
      ARCHIPEL_TELEMETRY_LOGLEVEL_CMD=$ARCHIPEL_TELEMETRY_LOGLEVEL
fi

# generate raw spec file 
/root/chain/archipel build-spec --chain=/root/chain/archipelSpec.json --raw > /root/chain/archipelSpecRaw.json

# adding keys to keystore
echo "Creating keystore directory..."
mkdir -p /root/chain/data/chains/archipel/keystore

echo "Removing 0x from public keys..."
ED25519_WITHOUT_0X=$(sed -E "s/0x(.*)/\1/g" <<< "$ARCHIPEL_PUBLIC_KEY_ED25519")
SR25519_WITHOUT_0X=$(sed -E "s/0x(.*)/\1/g" <<< "$ARCHIPEL_PUBLIC_KEY_SR25519")
echo "ED25519_WITHOUT_0X: $ED25519_WITHOUT_0X"
echo "SR25519_WITHOUT_0X: $SR25519_WITHOUT_0X"

echo "Appending prefixes to create filename..."
ED25519_FILE_PATH=$(echo "6772616e$ED25519_WITHOUT_0X")
SR25519_FILE_PATH=$(echo "61757261$SR25519_WITHOUT_0X")
echo "ED25519_FILE_PATH: $ED25519_FILE_PATH"
echo "SR25519_FILE_PATH: $SR25519_FILE_PATH"

echo "Writing key seed into files..."
echo "\"$ARCHIPEL_KEY_SEED\"" > "/root/chain/data/chains/archipel/keystore/$ED25519_FILE_PATH"
echo "\"$ARCHIPEL_KEY_SEED\"" > "/root/chain/data/chains/archipel/keystore/$SR25519_FILE_PATH"
echo "RESERVED_PEERS_PARAM: $RESERVED_PEERS_PARAM"

# if archipel chain has additionals params
if [ "--no-telemetry" == "$ARCHIPEL_TELEMETRY_URL_CMD" ]
then
      /root/chain/archipel \
            --chain=/root/chain/archipelSpecRaw.json \
            --base-path /root/chain/data \
            --validator \
            --prometheus-external \
            --prometheus-port 9616 \
            --port $ARCHIPEL_LISTEN_PORT \
            --node-key-file /config/$ARCHIPEL_NODE_KEY_FILE \
            --no-telemetry \
            --name "$ARCHIPEL_NODE_ALIAS" \
            $RESERVED_PEERS_PARAM
else
      /root/chain/archipel \
            --chain=/root/chain/archipelSpecRaw.json \
            --base-path /root/chain/data \
            --validator \
            --prometheus-external \
            --prometheus-port 9616 \
            --port $ARCHIPEL_LISTEN_PORT \
            --node-key-file /config/$ARCHIPEL_NODE_KEY_FILE \
            --telemetry-url "$ARCHIPEL_TELEMETRY_URL_CMD $ARCHIPEL_TELEMETRY_LOGLEVEL_CMD" \
            --name "$ARCHIPEL_NODE_ALIAS" \
            $RESERVED_PEERS_PARAM
fi
