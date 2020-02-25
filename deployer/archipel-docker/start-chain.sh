#!/bin/bash 

#check if env vars are set
if [ -z "$ARCHIPEL_NODE_ALIAS" ]
then
      echo "\$ARCHIPEL_NODE_ALIAS is empty"
      exit 1
fi

if [ -z "$ARCHIPEL_LISTEN_PORT" ]
then
      echo "\$ARCHIPEL_LISTEN_PORT not set. Set default to 30333"
      ARCHIPEL_LISTEN_PORT=30333
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

if [ ! -f /keys/$ARCHIPEL_NODE_KEY_FILE ]
then
      echo "\$/keys/$ARCHIPEL_NODE_KEY_FILE file not found"
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

ARCHIPEL_SS58_ADDRESS_ED25519=$(subkey --ed25519 inspect "$ARCHIPEL_KEY_SEED" | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_SS58_ADDRESS_ED25519" ]
then
      echo "\$ARCHIPEL_SS58_ADDRESS_ED25519 no found using subkey"
      exit 1
fi

ARCHIPEL_SS58_ADDRESS_SR25519=$(subkey --sr25519 inspect "$ARCHIPEL_KEY_SEED" | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_SS58_ADDRESS_SR25519" ]
then
      echo "\$ARCHIPEL_SS58_ADDRESS_SR25519 no found using subkey"
      exit 1
fi

ARCHIPEL_PUBLIC_KEY_ED25519=$(subkey --ed25519 inspect "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_PUBLIC_KEY_ED25519" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY_ED25519 no found using subkey"
      exit 1
fi

ARCHIPEL_PUBLIC_KEY_SR25519=$(subkey --sr25519 inspect "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')
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

# add SS58 Adress to aura.authorities 
 cat /root/chain/archipelSpec.json | jq '.genesis.runtime.aura.authorities = []'  > /tmp/archipelSpecTmp.json
 mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
for AUTH in $ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN
do
 cat /root/chain/archipelSpec.json | jq --arg AUTH $AUTH '.genesis.runtime.aura.authorities += [$AUTH]'  > /tmp/archipelSpecTmp.json
 mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
done

# add SS58 Adress to grandpa.authorities 
cat /root/chain/archipelSpec.json | jq '.genesis.runtime.grandpa.authorities = ["REPLACE_AUTHORITIES_HERE"]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
LIST_TO_INJECT=""
for ITEM in $ARCHIPEL_AUTHORITIES_ED25519_LIST_CLEAN
do
      ITEM_OUTPUT=$(echo "[\"$ITEM\",1]")
      LIST_TO_INJECT="$LIST_TO_INJECT $ITEM_OUTPUT,"
done

# remove last , of loop
LIST_TO_INJECT=${LIST_TO_INJECT%?} 
sed -i "s/\"REPLACE_AUTHORITIES_HERE\"/`echo $LIST_TO_INJECT`/g" /root/chain/archipelSpec.json

# add SS58 Adress to indices
cat /root/chain/archipelSpec.json | jq '.genesis.runtime.indices.ids = []'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
for AUTH in $ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN
do
 cat /root/chain/archipelSpec.json | jq --arg AUTH $AUTH '.genesis.runtime.indices.ids += [$AUTH]'  > /tmp/archipelSpecTmp.json
 mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
done

# add SS58 Adress Balances 
cat /root/chain/archipelSpec.json | jq '.genesis.runtime.balances.balances = ["REPLACE_BALANCES_HERE"]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
LIST_TO_INJECT=""
for ITEM in $ARCHIPEL_AUTHORITIES_SR25519_LIST_CLEAN
do
      ITEM_OUTPUT=$(echo "[\"$ITEM\",1152921504606847000]")
      LIST_TO_INJECT="$LIST_TO_INJECT $ITEM_OUTPUT,"
done

# remove last , of loop
LIST_TO_INJECT=${LIST_TO_INJECT%?} 
sed -i "s/\"REPLACE_BALANCES_HERE\"/`echo $LIST_TO_INJECT`/g" /root/chain/archipelSpec.json

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

# if archipel chain has additionals params
# is used for --bootnodes
if [ ! -z "$ARCHIPEL_CHAIN_ADDITIONAL_PARAMS" ]
then
      /root/chain/archipel \
            --chain=/root/chain/archipelSpecRaw.json \
            --base-path /root/chain/data \
            --validator \
            --port $ARCHIPEL_LISTEN_PORT \
            --name "$ARCHIPEL_NODE_ALIAS" \
            --node-key-file /keys/$ARCHIPEL_NODE_KEY_FILE \
            $ARCHIPEL_CHAIN_ADDITIONAL_PARAMS
else
      /root/chain/archipel \
            --chain=/root/chain/archipelSpecRaw.json \
            --base-path /root/chain/data \
            --validator \
            --port $ARCHIPEL_LISTEN_PORT \
            --node-key-file /keys/$ARCHIPEL_NODE_KEY_FILE \
            --name "$ARCHIPEL_NODE_ALIAS"
fi
