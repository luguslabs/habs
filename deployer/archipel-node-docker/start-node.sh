#!/bin/bash 

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


if [ -z "$ARCHIPEL_AUTHORITIES_ED25519_LIST" ]
then
      echo "\$ARCHIPEL_AUTHORITIES_SR25519_LIST is empty"
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

# if archipel chain has additionals params
# is used for --bootnodes
exec /root/chain/archipel \
      --chain=/root/chain/archipelSpecRaw.json \
      --base-path /root/chain/data \
      --rpc-cors "all" \
      --unsafe-rpc-external \
      --unsafe-ws-external \
      --port $ARCHIPEL_LISTEN_PORT \
      --name "$ARCHIPEL_NODE_ALIAS" \
      $ARCHIPEL_CHAIN_ADDITIONAL_PARAMS 
