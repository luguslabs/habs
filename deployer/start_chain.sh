#!/bin/sh 

#check env vars.


if [ -z "$ARCHIPEL_NODE_ALIAS" ]
then
      echo "\$ARCHIPEL_NODE_ALIAS is empty"
      exit 1
fi

if [ -z "$ARCHIPEL_KEY_SEED" ]
then
      echo "\$ARCHIPEL_KEY_SEED is empty"
      exit 1
fi

if [ -z "$ARCHIPEL_AUTHORITIES_LIST" ]
then
      echo "\$ARCHIPEL_AUTHORITIES_LIST is empty"
      exit 1
fi

echo "ARCHIPEL_AUTHORITIES_LIST is:"
echo $ARCHIPEL_AUTHORITIES_LIST
#sanitize ARCHIPEL_AUTHORITIES_LIST
#remove potential bad  char
echo "remove potential bad char"
echo "${ARCHIPEL_AUTHORITIES_LIST}" 
ARCHIPEL_AUTHORITIES_LIST_CLEAN=$(echo $ARCHIPEL_AUTHORITIES_LIST | tr -d ' ' | tr -d '"' | tr -d '[' | tr -d ']' | tr "," "\n")

if [ -z "$ARCHIPEL_AUTHORITIES_LIST_CLEAN" ]
then
      echo "\$ARCHIPEL_AUTHORITIES_LIST is empty"
      exit 1
fi
#create ARCHIPEL_AUTHORITIES_LIST format for config file

ARCHIPEL_AUTHORITIES_LIST_FOR_CONFIG=""
for authority in $ARCHIPEL_AUTHORITIES_LIST_CLEAN
do
    if [ -z "$ARCHIPEL_AUTHORITIES_LIST_FOR_CONFIG" ] 
    then
     ARCHIPEL_AUTHORITIES_LIST_FOR_CONFIG=$(echo "\"$authority\"")
    else
      ARCHIPEL_AUTHORITIES_LIST_FOR_CONFIG=$(echo "${ARCHIPEL_AUTHORITIES_LIST_FOR_CONFIG},\"$authority\"")
    fi
done

if [ ! -f /usr/local/bin/subkey ]
then
      echo "missing utils subkey command. Needed to extracts key parts"
      exit 1
fi

ARCHIPEL_SS58_ADDRESS=$(subkey inspect "$ARCHIPEL_KEY_SEED" | grep SS58 | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_SS58_ADDRESS" ]
then
      echo "\$ARCHIPEL_SS58_ADDRESS no found using subkey"
      exit 1
fi

ARCHIPEL_PUBLIC_KEY=$(subkey inspect "$ARCHIPEL_KEY_SEED" | grep Public | cut -d":" -f2 | sed -e 's/^[[:space:]]*//')

if [ -z "$ARCHIPEL_PUBLIC_KEY" ]
then
      echo "\$ARCHIPEL_PUBLIC_KEY no found using subkey"
      exit 1
fi

echo "decoded from seed : ARCHIPEL_SS58_ADDRESS : $ARCHIPEL_SS58_ADDRESS"
echo "decoded from seed : ARCHIPEL_PUBLIC_KEY : $ARCHIPEL_PUBLIC_KEY"
echo "formated ARCHIPEL_AUTHORITIES_LIST_FOR_CONFIG : $ARCHIPEL_AUTHORITIES_LIST_FOR_CONFIG"

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

# add bootnodes list if not empty
if [ ! -z "$ARCHIPEL_BOOTNODES" ]
then
      echo "\$ARCHIPEL_BOOTNODES  is not empty. Add list to  archipelSpec.json"
      cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_BOOTNODES "$ARCHIPEL_BOOTNODES"'.bootNodes = [$ARCHIPEL_BOOTNODES]'  > /tmp/archipelSpecTmp.json
      mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json
fi

# replace  "name": "Template"
cat /root/chain/archipelSpec.json | jq  '.name = "Archipel"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# replace  "id": "template"
cat /root/chain/archipelSpec.json | jq  '.id = "archipel"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# replace "protocolId"
cat /root/chain/archipelSpec.json | jq  '.protocolId = "1984"'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to aura.authorities 
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.aura.authorities = [$ARCHIPEL_SS58_ADDRESS]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to grandpa.authorities 
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.grandpa.authorities = [[$ARCHIPEL_SS58_ADDRESS , 1]]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to indices
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.indices.ids = [$ARCHIPEL_SS58_ADDRESS]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# add SS58 Adress to indices
cat /root/chain/archipelSpec.json | jq --arg ARCHIPEL_SS58_ADDRESS "$ARCHIPEL_SS58_ADDRESS" '.genesis.runtime.balances.balances = [[$ARCHIPEL_SS58_ADDRESS , 1152921504606846976]]'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# Remove sudo  
cat /root/chain/archipelSpec.json | jq 'del(.genesis.runtime.sudo)'  > /tmp/archipelSpecTmp.json
mv /tmp/archipelSpecTmp.json /root/chain/archipelSpec.json

# generate raw spec file 
/root/chain/archipel build-spec --chain=/root/chain/archipelSpec.json --raw > /root/chain/archipelSpecRaw.json


# remove data option volume to add ??? 
# launch chain 
exec /root/chain/archipel \
      --chain=/root/chain/archipelSpecRaw.json \
      --base-path /root/chain/data \
      --rpc-cors "all" \
      --unsafe-rpc-external \
      --unsafe-ws-external \
      --validator \
      --name "$ARCHIPEL_NODE_ALIAS"